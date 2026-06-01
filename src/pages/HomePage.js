import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, LEVELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'
import {
  playWeekCompleteSound, playMakeUpSound, playErrorSound,
  vibrate, VIBRATE,
} from '../lib/haptics'

// ── 屬性 icon CDN ──────────────────────────────────────
const CDN = 'https://cdn.jsdelivr.net/gh/duiker101/pokemon-type-svg-icons@master/icons'

// 依星期幾對應（0=週日, 1=週一, ..., 6=週六）
const TYPE_BY_WEEKDAY = {
  1: { type: 'water',    color: '#6890F0', name: '水',  label: '一' },
  2: { type: 'fire',     color: '#F08030', name: '火',  label: '二' },
  3: { type: 'grass',    color: '#78C850', name: '草',  label: '三' },
  4: { type: 'electric', color: '#F8D030', name: '電',  label: '四' },
  5: { type: 'psychic',  color: '#F85888', name: '超能', label: '五' },
  6: { type: 'fighting', color: '#C03028', name: '鬥',  label: '六' },
  0: { type: 'dragon',   color: '#7038F8', name: '龍',  label: '日' },
}

// ── Pull-to-refresh hook ──────────────────────────────
function usePullToRefresh(onRefresh) {
  const scrollRef = useRef(null)
  const startY = useRef(0)
  const pulling = useRef(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const THRESHOLD = 72

  const onTouchStart = useCallback((e) => {
    const el = scrollRef.current
    if (!el || el.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }, [])

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return
    const el = scrollRef.current
    if (!el || el.scrollTop > 0) { pulling.current = false; setPullDistance(0); return }
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) { e.preventDefault(); setPullDistance(Math.min(delta * 0.45, THRESHOLD + 20)) }
  }, [refreshing])

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true); setPullDistance(THRESHOLD)
      await onRefresh()
      setRefreshing(false)
    }
    setPullDistance(0)
  }, [pullDistance, onRefresh])

  return { scrollRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd, THRESHOLD }
}

const STATUS_COLOR = {
  pending:   { bg: '#FAEEDA', color: '#8B5A00' },
  completed: { bg: '#EAF3DE', color: '#173404' },
  cancelled: { bg: '#f5f5f5', color: '#999' },
}

export default function HomePage() {
  const { member, setMember, loginResult } = useAuth()
  const navigate = useNavigate()
  const [boss, setBoss] = useState(null)
  const [recentCards, setRecentCards] = useState([])
  const [weekLogins, setWeekLogins] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const [news, setNews] = useState(null)
  const [newsModal, setNewsModal] = useState(false)
  const [todayPoints, setTodayPoints] = useState(0)
  const [showWeekCelebration, setShowWeekCelebration] = useState(false)

  // 出貨相關
  const [shippingModal, setShippingModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [cannotOrderUntil, setCannotOrderUntil] = useState(null)
  const [shippingForm, setShippingForm] = useState({ store_name: '', recipient_name: '', phone: '', note: '' })
  const [shippingSaving, setShippingSaving] = useState(false)
  const [shippingError, setShippingError] = useState('')

  // 補簽相關
  const [makeUpModal, setMakeUpModal] = useState(null)
  const [makeUpSaving, setMakeUpSaving] = useState(false)
  const [makeUpError, setMakeUpError] = useState('')

  // 全勤慶祝
  useEffect(() => {
    if (loginResult?.weekComplete) {
      setTimeout(() => {
        setShowWeekCelebration(true)
        playWeekCompleteSound()
        vibrate(VIBRATE.weekComplete)
        setTimeout(() => setShowWeekCelebration(false), 4000)
      }, 2800)
    }
  }, [loginResult])

  const fetchData = useCallback(async () => {
    const [{ data: bossData }, { data: cardsData }, { data: settingsData }] = await Promise.all([
      supabase.from('boss_challenges').select('*').eq('is_active', true).single(),
      supabase.from('cards').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('settings').select('*'),
    ])
    setBoss(bossData)
    setRecentCards(cardsData || [])
    if (settingsData) {
      const s = {}
      settingsData.forEach(d => { try { s[d.key] = JSON.parse(d.value) } catch(e) { s[d.key] = d.value } })
      if (s.announcement) setAnnouncement(s.announcement)
      if (s.news) setNews(s.news)
    }
    if (member) {
      const today = new Date().toISOString().split('T')[0]
      const { data: loginData } = await supabase.from('point_logs')
        .select('points').eq('member_id', member.id)
        .gte('created_at', today).in('type', ['login', 'streak_bonus'])
      setTodayPoints((loginData || []).reduce((s, l) => s + l.points, 0))
      await fetchWeekLogins(member.id)
      await fetchShippingStatus(member.id)
    }
  }, [member])

  async function fetchWeekLogins(memberId) {
    // 生成本週一到本週日（固定7天，依星期幾對應屬性）
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // 計算本週一的日期（週一為一週起點）
    const dayOfWeek = today.getDay() // 0=日, 1=一 ... 6=六
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const weekday = d.getDay() // 0=日,1=一...6=六
      days.push({ date: dateStr, weekday })
    }

    // 查這週的簽到記錄
    const dateStrs = days.map(d => d.date)
    const { data: weekData } = await supabase.from('daily_logins')
      .select('login_date').eq('member_id', memberId).in('login_date', dateStrs)
    const loginDates = new Set((weekData || []).map(l => l.login_date))

    setWeekLogins(days.map(d => ({
      date: d.date,
      weekday: d.weekday,
      done: loginDates.has(d.date),
      typeConfig: TYPE_BY_WEEKDAY[d.weekday],
      isFuture: d.date > todayStr,
    })))
  }

  async function fetchShippingStatus(memberId) {
    const { data } = await supabase.from('shipping_orders')
      .select('*').eq('member_id', memberId)
      .order('created_at', { ascending: false }).limit(5)
    if (!data) return
    const pending = data.find(o => o.status === 'pending')
    setCurrentOrder(pending || null)
    const lastCancelled = data.find(o => o.status === 'cancelled' && o.cancelled_at)
    if (lastCancelled && !pending) {
      const unblockAt = new Date(new Date(lastCancelled.cancelled_at).getTime() + 7 * 24 * 60 * 60 * 1000)
      setCannotOrderUntil(unblockAt > new Date() ? unblockAt : null)
    } else {
      setCannotOrderUntil(null)
    }
    const lastOrder = data[0]
    if (lastOrder) {
      setShippingForm({ store_name: lastOrder.store_name || '', recipient_name: lastOrder.recipient_name || '', phone: lastOrder.phone || '', note: '' })
    }
  }

  useEffect(() => { fetchData() }, [fetchData])

  const { scrollRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd, THRESHOLD } = usePullToRefresh(fetchData)

  // ── 出貨 ────────────────────────────────────────────
  async function handleSubmitShipping() {
    if (!shippingForm.store_name.trim() || !shippingForm.recipient_name.trim() || !shippingForm.phone.trim()) {
      setShippingError('請填寫所有必填欄位'); return
    }
    setShippingSaving(true); setShippingError('')
    const { error } = await supabase.from('shipping_orders').insert({
      member_id: member.id, store_name: shippingForm.store_name.trim(),
      recipient_name: shippingForm.recipient_name.trim(), phone: shippingForm.phone.trim(),
      note: shippingForm.note.trim(), status: 'pending',
    })
    if (error) setShippingError('申請失敗，請稍後再試')
    else { setShippingModal(false); await fetchShippingStatus(member.id) }
    setShippingSaving(false)
  }

  async function handleCancelShipping() {
    if (!currentOrder) return
    setShippingSaving(true)
    await supabase.from('shipping_orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', currentOrder.id)
    setCancelModal(false); await fetchShippingStatus(member.id)
    setShippingSaving(false)
  }

  // ── 補簽 ────────────────────────────────────────────
  function openMakeUp(day) {
    const today = new Date().toISOString().split('T')[0]
    if (day.done || day.date >= today) return
    setMakeUpError(''); setMakeUpModal(day)
  }

  async function handleMakeUp() {
    if (!makeUpModal || !member) return
    if (member.points < 10) {
      setMakeUpError('積分不足 10 點，無法補簽'); playErrorSound(); vibrate(VIBRATE.error); return
    }
    setMakeUpSaving(true); setMakeUpError('')
    try {
      const { error: insertErr } = await supabase.from('daily_logins').insert({ member_id: member.id, login_date: makeUpModal.date })
      if (insertErr && !insertErr.message?.includes('duplicate')) throw insertErr
      const newPoints = member.points - 10
      const { getLevel } = await import('../lib/supabase')
      const newLevel = getLevel(newPoints)
      await supabase.from('members').update({ points: newPoints, level: newLevel }).eq('id', member.id)
      await supabase.from('point_logs').insert({ member_id: member.id, type: 'makeup', points: -10, note: `補簽 ${makeUpModal.date}` })
      setMember({ ...member, points: newPoints, level: newLevel })
      playMakeUpSound(); vibrate(VIBRATE.makeUp)
      setMakeUpModal(null); await fetchWeekLogins(member.id)
    } catch { setMakeUpError('補簽失敗，請稍後再試') }
    setMakeUpSaving(false)
  }

  const bossProgress = boss ? Math.round((boss.current_amount / boss.target_amount) * 100) : 0
  const nextLevel = LEVELS.find(l => l.min > (member?.points || 0))
  const currentLevelMin = LEVELS.slice().reverse().find(l => (member?.points || 0) >= l.min)?.min || 0
  const levelProgress = nextLevel ? Math.round(((member?.points || 0) - currentLevelMin) / (nextLevel.min - currentLevelMin) * 100) : 100
  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? { text: '早安', icon: 'fa-sun' } : hour < 18 ? { text: '午安', icon: 'fa-sun' } : { text: '晚安', icon: 'fa-moon' }
  const isPulling = pullDistance > 0
  const isReadyToRelease = pullDistance >= THRESHOLD
  const blockedDaysLeft = cannotOrderUntil ? Math.ceil((cannotOrderUntil - new Date()) / (1000 * 60 * 60 * 24)) : 0
  const signedCount = weekLogins.filter(d => d.done).length
  const isWeekComplete = weekLogins.length === 7 && weekLogins.filter(d => !d.isFuture).every(d => d.done)

  const inp = { width: '100%', padding: '10px 12px', border: '0.5px solid #f0e8d0', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', background: '#fdfaf4', boxSizing: 'border-box' }

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    hero: { background: 'linear-gradient(135deg,#fff 0%,#fdfaf4 55%,#faf0d8 100%)', padding: '22px 20px 20px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid #f0e8d0' },
    secLeft: { fontSize: 13, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 7 },
    typeBadge: (bg) => ({ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 10 }),
    card: { border: '1px solid #f0e8d0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: '#fff', boxShadow: '0 2px 8px rgba(186,117,23,.07)' },
    bossCard: { border: '1px solid #f0e8d0', borderRadius: 12, padding: 14, background: '#fdfaf4', boxShadow: '0 1px 6px rgba(186,117,23,.05)', marginBottom: 16 },
    levelCard: { border: '1px solid #f0e8d0', borderRadius: 12, padding: 14, boxShadow: '0 1px 6px rgba(186,117,23,.05)', marginBottom: 16 },
    lstat: { background: 'linear-gradient(135deg,#fdfaf4,#faf5eb)', borderRadius: 8, padding: 10, textAlign: 'center', border: '1px solid #f0e8d0' },
  }

  return (
    <div style={S.page}>

      {/* Pull-to-refresh */}
      <div style={{ overflow: 'hidden', height: refreshing ? 56 : isPulling ? Math.max(pullDistance * 0.9, 0) : 0, transition: isPulling ? 'none' : 'height 0.3s ease', background: 'linear-gradient(135deg,#fdfaf4,#fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: (isPulling || refreshing) ? '0.5px solid #f0e8d0' : 'none' }}>
        <div style={{ width: 28, height: 28, opacity: refreshing ? 1 : Math.min(pullDistance / THRESHOLD, 1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 28 28" width="28" height="28">
            <path d="M14 2 A12 12 0 0 1 26 14 L14 14 Z" fill={isReadyToRelease || refreshing ? '#E24B4A' : '#FAC775'} />
            <path d="M14 2 A12 12 0 0 0 2 14 L14 14 Z" fill={isReadyToRelease || refreshing ? '#E24B4A' : '#FAC775'} />
            <path d="M26 14 A12 12 0 0 1 14 26 L14 14 Z" fill="#f0f0f0" />
            <path d="M2 14 A12 12 0 0 0 14 26 L14 14 Z" fill="#f0f0f0" />
            <line x1="2" y1="14" x2="26" y2="14" stroke="#fff" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="4" fill="#fff" stroke={isReadyToRelease || refreshing ? '#E24B4A' : '#FAC775'} strokeWidth="1.5" />
            <circle cx="14" cy="14" r="2" fill={isReadyToRelease || refreshing ? '#E24B4A' : '#FAC775'} />
            {refreshing && <animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="0.8s" repeatCount="indefinite" />}
          </svg>
        </div>
        <span style={{ fontSize: 11, color: '#BA7517', marginLeft: 8, opacity: refreshing ? 1 : Math.min(pullDistance / THRESHOLD * 1.5, 1) }}>
          {refreshing ? '更新中...' : isReadyToRelease ? '放開以更新' : '下拉更新'}
        </span>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        {/* Hero */}
        <div style={S.hero}>
          <svg style={{ position: 'absolute', right: -16, bottom: -22, width: 110, height: 110, opacity: 0.07, pointerEvents: 'none' }} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="47" stroke="#BA7517" strokeWidth="4"/>
            <path d="M3 50 Q27 37 50 50 Q73 63 97 50" stroke="#BA7517" strokeWidth="4" fill="none"/>
            <circle cx="50" cy="50" r="12" fill="none" stroke="#BA7517" strokeWidth="4"/>
            <circle cx="50" cy="50" r="6" fill="#BA7517"/>
          </svg>
          {[[12,15],[8,55],[22,80],[35,25],[15,40],[6,70],[42,8],[30,90]].map(([t,l],i) => (
            <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width: i%2===0?2:3, height: i%2===0?2:3, borderRadius:'50%', background:'#BA7517', opacity: 0.3+i*0.05 }} />
          ))}
          <div style={{ position:'absolute', bottom:-8, left:-8, fontSize:88, opacity:0.055, color:'#BA7517', lineHeight:1, pointerEvents:'none' }}>
            <i className={`fa-solid ${greeting.icon}`}></i>
          </div>

          {/* ── BUG 1 修正：固定尺寸容器讓圓框正確包住 SVG ── */}
          <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {member && (
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '2px solid #FAC775',
                boxShadow: '0 2px 8px rgba(186,117,23,.2)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff',
                flexShrink: 0,
              }}>
                <PokeballIcon level={member.level} size={36} />
              </div>
            )}
            <span style={{ fontSize: 7, color: '#BA7517', fontWeight: 700, letterSpacing: '0.05em' }}>{member?.level}</span>
          </div>

          <div style={{ fontSize: 9, fontWeight: 700, color: '#BA7517', letterSpacing: '0.12em', opacity: 0.5, marginBottom: 9 }}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>
            {greeting.text}，<span style={{ color: '#BA7517' }}>{member?.display_name || 'Trainer'}</span>
          </div>
          <div style={{ fontSize: 14, color: '#666', margin: '2px 0 12px' }}>今天要開什麼包？</div>
          {todayPoints > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#FFF8E7,#FAEEDA)', border: '1px solid #FAC775', borderRadius: 999, padding: '5px 13px', fontSize: 11, color: '#7A4A00', fontWeight: 600 }}>
              <i className="fa-solid fa-star" style={{ color: '#BA7517', fontSize: 11 }}></i>
              今日已獲得 <strong style={{ color: '#BA7517', margin: '0 1px' }}>+{todayPoints}</strong> 點
            </div>
          )}
        </div>

        {/* 公告 */}
        {announcement && (
          <div style={{ background: '#fffdf7', borderBottom: '1px solid #f5edd8', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <style>{`@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}`}</style>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#8B5A00', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '1px solid #FAC775', borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>公告</span>
            <div style={{ width: 1, height: 14, background: 'linear-gradient(180deg,transparent,#FAC775,transparent)', flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: 11, color: '#666', fontStyle: 'italic', animation: 'marquee 12s linear infinite' }}>{announcement}</span>
            </div>
          </div>
        )}

        {/* 每日新聞 */}
        {news && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #f5f0e8' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#888', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <i className="fa-solid fa-newspaper" style={{ fontSize: 13, color: '#BA7517' }}></i>每日新聞
            </div>
            <div style={{ border: '1px solid #f0e8d0', borderRadius: 8, overflow: 'hidden', display: 'flex', cursor: news?.body ? 'pointer' : 'default', background: 'linear-gradient(135deg,#fdfaf4,#fff)' }} onClick={() => news?.body && setNewsModal(true)}>
              <div style={{ width: 80, minHeight: 64, background: 'linear-gradient(135deg,#f5ede0,#f0e8d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {news.image_url ? <img src={news.image_url} alt="news" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-image" style={{ fontSize: 20, color: '#D4A94A' }}></i>}
              </div>
              <div style={{ padding: '8px 10px', flex: 1 }}>
                <div style={{ fontSize: 8, color: '#BA7517', fontWeight: 600, marginBottom: 2 }}>最新消息</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#222', lineHeight: 1.45 }}>{news.title}</div>
                <div style={{ fontSize: 9, color: '#bbb', marginTop: 4 }}>{news.date}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '16px 20px 0' }}>

          {/* 戰績牆 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={S.secLeft}>
              <span style={S.typeBadge('linear-gradient(135deg,#BA7517,#D4A94A)')}><i className="fa-solid fa-trophy"></i></span>
              戰績牆
            </div>
            <span style={{ fontSize: 11, color: '#ccc', cursor: 'pointer' }} onClick={() => navigate('/wall')}>全部 →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 16 }}>
            {recentCards.map((card, idx) => (
              <div key={card.id} onClick={() => navigate('/wall')} style={S.card}>
                <div style={{ aspectRatio: '3/4', background: '#f8f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {card.image_url ? <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-id-card" style={{ fontSize: 28, color: '#D4A94A', opacity: 0.4 }}></i>}
                  <span style={{ position: 'absolute', top: 5, left: 5, fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 99, background: '#FCEBEB', color: '#791F1F' }}>{card.rarity}</span>
                  {idx === 0 && <span style={{ position: 'absolute', top: 5, right: 5, fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 99, background: '#E24B4A', color: '#fff' }}>NEW</span>}
                </div>
                <div style={{ padding: '6px 7px 8px' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#111', marginBottom: 2 }}>{card.name}</div>
                  <div style={{ fontSize: 8, color: '#BA7517' }}>{card.series}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Boss */}
          {boss && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={S.secLeft}>
                  <span style={S.typeBadge('linear-gradient(135deg,#A32D2D,#E24B4A)')}><i className="fa-solid fa-shield"></i></span>
                  共同挑戰
                </div>
                <span style={{ fontSize: 11, color: '#ccc', cursor: 'pointer' }} onClick={() => navigate('/challenge')}>詳情 →</span>
              </div>
              <div style={S.bossCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F09595' }}>
                    <i className="fa-solid fa-skull" style={{ fontSize: 18, color: '#E24B4A' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{boss.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>每月 {boss.reset_day} 日重置</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#A32D2D', fontWeight: 700 }}>HP {100 - bossProgress}%</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 5 }}>
                  <span>${boss.current_amount?.toLocaleString()}</span><span>目標 ${boss.target_amount?.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, background: '#f0e8d0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${bossProgress}%`, background: 'linear-gradient(90deg,#E24B4A,#EF9F27)', borderRadius: 99 }} />
                </div>
              </div>
            </>
          )}

          {/* 等級進度 */}
          {member && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <div style={S.secLeft}>
                  <span style={S.typeBadge('linear-gradient(135deg,#BA7517,#EF9F27)')}><i className="fa-solid fa-medal"></i></span>
                  我的進度
                </div>
              </div>
              <div style={S.levelCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  {member.avatar_url
                    ? <img src={member.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FAC775', flexShrink: 0 }} />
                    : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#633806', border: '2px solid #FAC775', flexShrink: 0 }}>
                        {member.display_name?.[0]?.toUpperCase()}
                      </div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{member.display_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PokeballIcon level={member.level} size={12} />
                      <span style={{ fontSize: 10, color: '#BA7517', fontWeight: 600 }}>{member.level}</span>
                    </div>
                  </div>
                  {nextLevel && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, color: '#999' }}>距離{nextLevel.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#BA7517' }}>+{(nextLevel.min - member.points).toLocaleString()} 點</div>
                    </div>
                  )}
                </div>
                <div style={{ height: 7, background: '#f0e8d0', borderRadius: 99, overflow: 'hidden', marginBottom: 3 }}>
                  <div style={{ height: '100%', width: `${levelProgress}%`, background: 'linear-gradient(90deg,#378ADD,#BA7517)', borderRadius: 99 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#bbb', marginBottom: 10 }}>
                  <span>{member.points?.toLocaleString()} 點</span><span>{levelProgress}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {[{ num: member.points?.toLocaleString(), label: '累積積分' }, { num: member.login_streak, label: '連續登入' }, { num: `$${member.total_spent?.toLocaleString()}`, label: '累積消費' }].map((s, i) => (
                    <div key={i} style={S.lstat}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{s.num}</div>
                      <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── 本週簽到 ── */}
          {weekLogins.length > 0 && (
            <div style={{ marginBottom: 100 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={S.secLeft}>
                  <span style={S.typeBadge('linear-gradient(135deg,#378ADD,#185FA5)')}><i className="fa-solid fa-calendar-check"></i></span>
                  本週簽到
                  {isWeekComplete && (
                    <span style={{ fontSize: 9, background: 'linear-gradient(135deg,#EAF3DE,#D4F0B8)', color: '#173404', padding: '2px 7px', borderRadius: 99, border: '1px solid #86C566', fontWeight: 700, marginLeft: 4 }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: 3 }}></i>全勤達成！
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 9, color: '#bbb' }}>7天全勤 +15點</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {weekLogins.map((d) => {
                  const isToday = d.date === today
                  const canMakeUp = !d.done && !isToday && !d.isFuture
                  const tc = d.typeConfig

                  // 背景色：今天已簽=紅、已簽=金、未來=淡灰、可補簽=米白、今天未簽=淡紅提示
                  const bg = d.done
                    ? (isToday ? '#FCEBEB' : 'linear-gradient(135deg,#FAEEDA,#FFF3D0)')
                    : d.isFuture ? '#f5f5f5' : isToday ? '#fff5f5' : '#f8f5f0'
                  const borderColor = d.done
                    ? (isToday ? '#F09595' : '#FAC775')
                    : d.isFuture ? '#eee' : isToday ? '#F09595' : canMakeUp ? '#e5ddd0' : '#eee'

                  return (
                    <div
                      key={d.date}
                      onClick={() => canMakeUp && openMakeUp(d)}
                      style={{
                        aspectRatio: 1, borderRadius: 9,
                        background: bg, border: `1px solid ${borderColor}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        cursor: canMakeUp ? 'pointer' : 'default',
                        position: 'relative', transition: 'transform 0.1s',
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: d.done ? tc.color : d.isFuture ? '#ddd' : isToday ? tc.color : '#d0c8be',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: d.done ? 1 : d.isFuture ? 0.3 : isToday ? 0.35 : 0.45,
                      }}>
                        <img src={`${CDN}/${tc.type}.svg`} alt={tc.name} style={{ width: 13, height: 13 }} />
                      </div>
                      <span style={{ fontSize: 8, fontWeight: 700, color: d.done ? (isToday ? '#7A1A1A' : '#7A4A00') : d.isFuture ? '#ccc' : '#bbb' }}>
                        {tc.label}
                      </span>
                      {/* 可補簽提示小點 */}
                      {canMakeUp && (
                        <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: '#BA7517', opacity: 0.6 }} />
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#bbb' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#BA7517', opacity: 0.6, flexShrink: 0 }} />
                點擊未簽日期可補簽（消耗 10 積分）
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 我要出貨 固定按鈕 */}
      <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: '0 20px', pointerEvents: 'none', zIndex: 50 }}>
        {currentOrder ? (
          <div style={{ pointerEvents: 'auto', background: 'linear-gradient(135deg,#fdfaf4,#fff)', border: '1px solid #FAC775', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(186,117,23,.15)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-solid fa-truck" style={{ fontSize: 16, color: '#BA7517' }}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>{currentOrder.store_name}</div>
              <div style={{ fontSize: 10, color: '#999' }}>{currentOrder.recipient_name} · {currentOrder.phone}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 10, background: STATUS_COLOR.pending.bg, color: STATUS_COLOR.pending.color, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>待出貨</span>
              <span onClick={() => setCancelModal(true)} style={{ fontSize: 10, color: '#A32D2D', cursor: 'pointer', textDecoration: 'underline' }}>取消申請</span>
            </div>
          </div>
        ) : cannotOrderUntil ? (
          <div style={{ pointerEvents: 'auto', background: '#f8f8f8', border: '1px solid #e5e5e5', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fa-solid fa-clock" style={{ fontSize: 18, color: '#ccc' }}></i>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#888' }}>出貨申請暫時停用</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>取消後 {blockedDaysLeft} 天內無法再申請</div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShippingModal(true)} style={{ pointerEvents: 'auto', width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(186,117,23,.35)' }}>
            <i className="fa-solid fa-truck"></i> 我要出貨
          </button>
        )}
      </div>

      {/* 全勤慶祝 */}
      {showWeekCelebration && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', maxWidth: 390, margin: '0 auto' }}>
          <style>{`
            @keyframes celebPop{0%{transform:scale(0.5) translateY(30px);opacity:0}60%{transform:scale(1.08) translateY(-4px)}100%{transform:scale(1) translateY(0);opacity:1}}
            @keyframes celebFadeOut{0%{opacity:1}80%{opacity:1}100%{opacity:0}}
            @keyframes confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(80px) rotate(720deg);opacity:0}}
          `}</style>
          <div style={{ background: 'linear-gradient(135deg,#fff,#fdfaf4)', border: '1.5px solid #FAC775', borderRadius: 20, padding: '22px 28px', textAlign: 'center', boxShadow: '0 8px 32px rgba(186,117,23,.25)', animation: 'celebPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both, celebFadeOut 4s ease forwards', position: 'relative', overflow: 'hidden' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ position: 'absolute', top: '20%', left: '50%', width: 6, height: 6, borderRadius: '50%', background: ['#BA7517','#E24B4A','#378ADD','#06C755','#FAC775','#F85888','#7038F8','#78C850'][i], transform: `rotate(${i * 45}deg) translateY(-50px)`, animation: `confetti 0.8s ${i * 0.06}s ease both` }} />
            ))}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
              {Object.values(TYPE_BY_WEEKDAY).map(tc => (
                <div key={tc.type} style={{ width: 24, height: 24, borderRadius: '50%', background: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={`${CDN}/${tc.type}.svg`} alt={tc.name} style={{ width: 14, height: 14 }} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#BA7517', marginBottom: 4 }}>7日全勤達成！</div>
            <div style={{ fontSize: 12, color: '#8B5A00' }}>額外獲得 <strong style={{ color: '#E24B4A', fontSize: 16 }}>+15</strong> 積分！</div>
          </div>
        </div>
      )}

      {/* 新聞彈窗 */}
      {newsModal && news && (
        <div onClick={() => setNewsModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0' }} />
            {news.image_url && <img src={news.image_url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />}
            <div style={{ padding: '16px 20px 32px' }}>
              <div style={{ fontSize: 10, color: '#BA7517', fontWeight: 600, marginBottom: 6 }}>最新消息</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#111', lineHeight: 1.4, marginBottom: 8 }}>{news.title}</div>
              <div style={{ fontSize: 11, color: '#bbb', marginBottom: 16 }}>{news.date}</div>
              <div style={{ fontSize: 14, color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{news.body}</div>
            </div>
          </div>
        </div>
      )}

      {/* 補簽 Modal */}
      {makeUpModal && (
        <div onClick={() => setMakeUpModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 300, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>補簽確認</div>
              <span onClick={() => setMakeUpModal(null)} style={{ fontSize: 18, color: '#aaa', cursor: 'pointer' }}>✕</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: makeUpModal.typeConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${makeUpModal.typeConfig.color}66` }}>
                <img src={`${CDN}/${makeUpModal.typeConfig.type}.svg`} alt={makeUpModal.typeConfig.name} style={{ width: 28, height: 28 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{makeUpModal.typeConfig.name}系 · 星期{makeUpModal.typeConfig.label}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{makeUpModal.date}</div>
              </div>
            </div>
            <div style={{ background: '#fdfaf4', border: '1px solid #f0e8d0', borderRadius: 10, padding: '10px 14px', marginBottom: makeUpError ? 10 : 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
                <span>補簽費用</span><span style={{ fontWeight: 700, color: '#E24B4A' }}>-10 積分</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                <span>目前積分</span><span style={{ fontWeight: 700, color: '#111' }}>{member?.points?.toLocaleString()} 點</span>
              </div>
              {member?.points >= 10 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginTop: 4, paddingTop: 4, borderTop: '0.5px solid #f0e8d0' }}>
                  <span>補簽後積分</span><span style={{ fontWeight: 700, color: '#BA7517' }}>{(member.points - 10).toLocaleString()} 點</span>
                </div>
              )}
            </div>
            {makeUpError && <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{makeUpError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMakeUpModal(null)} style={{ flex: 1, padding: 10, border: '1px solid #f0e8d0', borderRadius: 10, fontSize: 13, color: '#888', background: '#fdfaf4', cursor: 'pointer' }}>取消</button>
              <button onClick={handleMakeUp} disabled={makeUpSaving || (member?.points || 0) < 10}
                style={{ flex: 2, padding: 10, background: makeUpSaving || (member?.points || 0) < 10 ? '#ccc' : 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                {makeUpSaving ? '補簽中...' : '確認補簽 (-10點)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 出貨 Modal */}
      {shippingModal && (
        <div onClick={() => setShippingModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: '0 0 32px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 16px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#111', marginBottom: 4 }}>出貨申請</div>
              <div style={{ fontSize: 12, color: '#bbb', marginBottom: 20 }}>申請後由後台人員處理出貨</div>
              {shippingError && <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{shippingError}</div>}
              {[
                { label: '711 門市名稱', key: 'store_name', placeholder: '例：台北忠孝門市', req: true },
                { label: '收貨姓名', key: 'recipient_name', placeholder: '例：王小明', req: true },
                { label: '手機號碼', key: 'phone', placeholder: '例：0912345678', req: true, type: 'tel' },
                { label: '備註（選填）', key: 'note', placeholder: '例：請勿摺疊', req: false },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 5 }}>{f.label} {f.req && <span style={{ color: '#E24B4A' }}>*</span>}</label>
                  <input value={shippingForm[f.key]} onChange={e => setShippingForm({ ...shippingForm, [f.key]: e.target.value })} placeholder={f.placeholder} type={f.type || 'text'} style={inp} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setShippingModal(false)} style={{ flex: 1, padding: 12, border: '1px solid #f0e8d0', borderRadius: 10, fontSize: 14, color: '#888', background: '#fdfaf4', cursor: 'pointer' }}>取消</button>
                <button onClick={handleSubmitShipping} disabled={shippingSaving} style={{ flex: 2, padding: 12, background: shippingSaving ? '#ccc' : 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  {shippingSaving ? '申請中...' : '確認申請'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 取消出貨 Modal */}
      {cancelModal && (
        <div onClick={() => setCancelModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 320, padding: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 20, color: '#E24B4A' }}></i>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', textAlign: 'center', marginBottom: 8 }}>確認取消出貨？</div>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 1.6, marginBottom: 18 }}>
              取消後 <strong style={{ color: '#E24B4A' }}>7 天內</strong>將無法再申請出貨
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCancelModal(false)} style={{ flex: 1, padding: 11, border: '1px solid #ddd', borderRadius: 10, fontSize: 13, color: '#666', background: 'transparent', cursor: 'pointer' }}>保留申請</button>
              <button onClick={handleCancelShipping} disabled={shippingSaving} style={{ flex: 1, padding: 11, background: shippingSaving ? '#ccc' : '#E24B4A', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                {shippingSaving ? '處理中...' : '確認取消'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
