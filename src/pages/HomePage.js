import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, LEVELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'

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

const STATUS_LABEL = { pending: '待出貨', completed: '已完成', cancelled: '已取消' }
const STATUS_COLOR = { pending: { bg: '#FAEEDA', color: '#8B5A00' }, completed: { bg: '#EAF3DE', color: '#173404' }, cancelled: { bg: '#f5f5f5', color: '#999' } }

export default function HomePage() {
  const { member } = useAuth()
  const navigate = useNavigate()
  const [boss, setBoss] = useState(null)
  const [recentCards, setRecentCards] = useState([])
  const [weekLogins, setWeekLogins] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const [news, setNews] = useState(null)
  const [newsModal, setNewsModal] = useState(false)
  const [todayPoints, setTodayPoints] = useState(0)

  // 出貨相關
  const [shippingModal, setShippingModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null) // 目前 pending 訂單
  const [cannotOrderUntil, setCannotOrderUntil] = useState(null) // 7天封鎖到期時間
  const [shippingForm, setShippingForm] = useState({ store_name: '', recipient_name: '', phone: '', note: '' })
  const [shippingSaving, setShippingSaving] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const fetchData = useCallback(async () => {
    const [{ data: bossData }, { data: cardsData }, { data: settingsData }] = await Promise.all([
      supabase.from('boss_challenges').select('*').eq('is_active', true).single(),
      supabase.from('cards').select('*, card_owners(member_id, members(display_name))').order('created_at', { ascending: false }).limit(3),
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

      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        days.push(d.toISOString().split('T')[0])
      }
      const { data: weekData } = await supabase.from('daily_logins')
        .select('login_date').eq('member_id', member.id).in('login_date', days)
      const loginDates = new Set((weekData || []).map(l => l.login_date))
      setWeekLogins(days.map(d => ({ date: d, done: loginDates.has(d) })))

      // 讀取出貨訂單狀態
      await fetchShippingStatus(member.id)
    }
  }, [member])

  async function fetchShippingStatus(memberId) {
    const { data } = await supabase.from('shipping_orders')
      .select('*').eq('member_id', memberId)
      .order('created_at', { ascending: false }).limit(5)
    if (!data) return

    const pending = data.find(o => o.status === 'pending')
    setCurrentOrder(pending || null)

    // 檢查 7 天封鎖：最近一筆 cancelled 的 cancelled_at
    const lastCancelled = data.find(o => o.status === 'cancelled' && o.cancelled_at)
    if (lastCancelled && !pending) {
      const unblockAt = new Date(new Date(lastCancelled.cancelled_at).getTime() + 7 * 24 * 60 * 60 * 1000)
      if (unblockAt > new Date()) {
        setCannotOrderUntil(unblockAt)
      } else {
        setCannotOrderUntil(null)
      }
    } else {
      setCannotOrderUntil(null)
    }

    // 預填上次填過的資料（最近一筆有資料的訂單）
    const lastOrder = data[0]
    if (lastOrder) {
      setShippingForm({
        store_name: lastOrder.store_name || '',
        recipient_name: lastOrder.recipient_name || '',
        phone: lastOrder.phone || '',
        note: '',
      })
    }
  }

  useEffect(() => { fetchData() }, [fetchData])

  const { scrollRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd, THRESHOLD } = usePullToRefresh(fetchData)

  // ── 送出出貨申請 ────────────────────────────────────
  async function handleSubmitShipping() {
    if (!shippingForm.store_name.trim() || !shippingForm.recipient_name.trim() || !shippingForm.phone.trim()) {
      setShippingError('請填寫所有必填欄位')
      return
    }
    setShippingSaving(true)
    setShippingError('')
    const { error } = await supabase.from('shipping_orders').insert({
      member_id: member.id,
      store_name: shippingForm.store_name.trim(),
      recipient_name: shippingForm.recipient_name.trim(),
      phone: shippingForm.phone.trim(),
      note: shippingForm.note.trim(),
      status: 'pending',
    })
    if (error) {
      setShippingError('申請失敗，請稍後再試')
    } else {
      setShippingModal(false)
      await fetchShippingStatus(member.id)
    }
    setShippingSaving(false)
  }

  // ── 取消出貨 ────────────────────────────────────────
  async function handleCancelShipping() {
    if (!currentOrder) return
    setShippingSaving(true)
    await supabase.from('shipping_orders').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('id', currentOrder.id)
    setCancelModal(false)
    await fetchShippingStatus(member.id)
    setShippingSaving(false)
  }

  const bossProgress = boss ? Math.round((boss.current_amount / boss.target_amount) * 100) : 0
  const nextLevel = LEVELS.find(l => l.min > (member?.points || 0))
  const currentLevelMin = LEVELS.slice().reverse().find(l => (member?.points || 0) >= l.min)?.min || 0
  const levelProgress = nextLevel ? Math.round(((member?.points || 0) - currentLevelMin) / (nextLevel.min - currentLevelMin) * 100) : 100
  const today = new Date().toISOString().split('T')[0]
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  const hour = new Date().getHours()
  const greeting = hour >= 5 && hour < 12 ? { text: '早安', icon: 'fa-sun' } : hour >= 12 && hour < 18 ? { text: '午安', icon: 'fa-sun' } : { text: '晚安', icon: 'fa-moon' }

  const isPulling = pullDistance > 0
  const isReadyToRelease = pullDistance >= THRESHOLD

  // 計算封鎖剩餘天數
  const blockedDaysLeft = cannotOrderUntil
    ? Math.ceil((cannotOrderUntil - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  const inp = { width: '100%', padding: '10px 12px', border: '0.5px solid #f0e8d0', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', background: '#fdfaf4', boxSizing: 'border-box' }

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    hero: { background: 'linear-gradient(135deg,#fff 0%,#fdfaf4 60%,#faf4e8 100%)', padding: '22px 20px 20px', position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid #f0e8d0' },
    glow1: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.08) 0%,transparent 70%)' },
    glow2: { position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.05) 0%,transparent 70%)' },
    goldLine1: { position: 'absolute', background: 'linear-gradient(90deg,transparent,#BA7517,transparent)', height: 0.5, opacity: 0.2, width: 100, top: '30%', left: -10 },
    goldLine2: { position: 'absolute', background: 'linear-gradient(90deg,transparent,#BA7517,transparent)', height: 0.5, opacity: 0.2, width: 80, top: '68%', right: -10 },
    secLeft: { fontSize: 14, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6 },
    card: { border: '0.5px solid #f0e8d0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: '#fff', boxShadow: '0 1px 6px rgba(186,117,23,0.05)' },
    bossCard: { border: '0.5px solid #f0e8d0', borderRadius: 12, padding: 14, background: '#fdfaf4', boxShadow: '0 1px 6px rgba(186,117,23,0.05)', marginBottom: 16 },
    levelCard: { border: '0.5px solid #f0e8d0', borderRadius: 12, padding: 14, boxShadow: '0 1px 6px rgba(186,117,23,0.05)', marginBottom: 16 },
    lstat: { background: '#f8f5f0', borderRadius: 8, padding: 10, textAlign: 'center' },
    day: (active, done) => ({
      aspectRatio: 1, borderRadius: 7,
      background: active ? '#FCEBEB' : done ? 'linear-gradient(135deg,#FAEEDA,#FFF3D0)' : '#f8f5f0',
      border: `0.5px solid ${active ? '#F09595' : done ? '#FAC775' : '#eee'}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: 9,
      color: active ? '#A32D2D' : done ? '#8B5A00' : '#ccc',
    }),
  }

  return (
    <div style={S.page}>

      {/* Pull-to-refresh 指示器 */}
      <div style={{
        overflow: 'hidden',
        height: refreshing ? 56 : isPulling ? Math.max(pullDistance * 0.9, 0) : 0,
        transition: isPulling ? 'none' : 'height 0.3s ease',
        background: 'linear-gradient(135deg,#fdfaf4,#fff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: (isPulling || refreshing) ? '0.5px solid #f0e8d0' : 'none',
      }}>
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
          <div style={S.glow1} /><div style={S.glow2} />
          <div style={S.goldLine1} /><div style={S.goldLine2} />
          {[[12,15],[8,55],[22,80],[35,25],[15,40],[6,70],[42,8],[30,90]].map(([t,l],i) => (
            <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width: i%2===0?2:3, height: i%2===0?2:3, borderRadius:'50%', background:'#BA7517', opacity: 0.3+i*0.05 }} />
          ))}
          <div style={{ position:'absolute', bottom:-8, left:-8, fontSize:88, opacity:0.055, color:'#BA7517', lineHeight:1, pointerEvents:'none' }}>
            <i className={`fa-solid ${greeting.icon}`}></i>
          </div>
          <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {member && <PokeballIcon level={member.level} size={34} />}
            <span style={{ fontSize: 8, color: '#BA7517', fontWeight: 600, letterSpacing: '0.06em' }}>{member?.level}</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#BA7517', letterSpacing: '0.1em', opacity: 0.45, marginBottom: 12 }}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.3 }}>
            {greeting.text}，<span style={{ color: '#BA7517' }}>{member?.display_name || 'Trainer'}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.3, marginBottom: 12 }}>今天要開什麼包？</div>
          {todayPoints > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg,#FAEEDA,#FFF8EE)', border: '0.5px solid #FAC775', color: '#8B5A00', fontSize: 10, padding: '3px 10px', borderRadius: 20 }}>
              <i className="fa-solid fa-star" style={{ fontSize: 10, color: '#BA7517' }}></i>
              今日已獲得 <strong style={{ color: '#BA7517', margin: '0 2px' }}>+{todayPoints}</strong> 點
            </div>
          )}
        </div>

        {/* 公告 */}
        {announcement && (
          <div style={{ background: '#fff', padding: '10px 20px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <style>{`@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}`}</style>
            <span style={{ fontSize: 9, fontWeight: 600, color: '#BA7517', border: '0.5px solid #FAC775', padding: '2px 8px', borderRadius: 3, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>公告</span>
            <div style={{ width: 1, height: 14, background: 'linear-gradient(180deg,transparent,#FAC775,transparent)', flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: 11, color: '#666', fontStyle: 'italic', animation: 'marquee 12s linear infinite' }}>{announcement}</span>
            </div>
          </div>
        )}

        {/* 每日新聞 */}
        {news && (
          <div style={{ background: '#fff', padding: '12px 20px', borderBottom: '0.5px solid #f5f0e8' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#888', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <i className="fa-solid fa-newspaper" style={{ fontSize: 13, color: '#BA7517' }}></i>每日新聞
            </div>
            <div style={{ background: 'linear-gradient(135deg,#fdfaf4,#fff)', border: '0.5px solid #f0e8d0', borderRadius: 8, overflow: 'hidden', display: 'flex', cursor: news?.body ? 'pointer' : 'default' }} onClick={() => news?.body && setNewsModal(true)}>
              <div style={{ width: 80, minHeight: 64, background: 'linear-gradient(135deg,#f5ede0,#f0e8d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {news.image_url ? <img src={news.image_url} alt="news" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-image" style={{ fontSize: 20, color: '#D4A94A' }}></i>}
              </div>
              <div style={{ padding: '8px 10px', flex: 1 }}>
                <div style={{ fontSize: 8, color: '#BA7517', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>最新消息</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#222', lineHeight: 1.45 }}>{news.title}</div>
                <div style={{ fontSize: 9, color: '#bbb', marginTop: 4 }}>{news.date}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '16px 20px 0' }}>

          {/* 戰績牆 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={S.secLeft}><i className="fa-solid fa-trophy" style={{ fontSize: 14, color: '#BA7517' }}></i>戰績牆</div>
            <span style={{ fontSize: 12, color: '#bbb', cursor: 'pointer' }} onClick={() => navigate('/wall')}>全部 →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
            {recentCards.map((card, idx) => (
              <div key={card.id} onClick={() => navigate('/wall')} style={S.card}>
                <div style={{ aspectRatio: '3/4', background: '#f8f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {card.image_url ? <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-id-card" style={{ fontSize: 28, color: '#D4A94A', opacity: 0.4 }}></i>}
                  <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 8, fontWeight: 600, padding: '2px 5px', borderRadius: 20, background: '#FCEBEB', color: '#791F1F' }}>{card.rarity}</span>
                  {idx === 0 && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: 600, padding: '2px 5px', borderRadius: 20, background: '#E24B4A', color: 'white' }}>NEW</span>}
                </div>
                <div style={{ padding: '7px 8px 9px' }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: '#111', marginBottom: 2 }}>{card.name}</div>
                  <div style={{ fontSize: 9, color: '#BA7517' }}>{card.series}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Boss */}
          {boss && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={S.secLeft}><i className="fa-solid fa-shield" style={{ fontSize: 14, color: '#BA7517' }}></i>共同挑戰</div>
                <span style={{ fontSize: 12, color: '#bbb', cursor: 'pointer' }} onClick={() => navigate('/challenge')}>詳情 →</span>
              </div>
              <div style={S.bossCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #F09595' }}>
                    <i className="fa-solid fa-shield" style={{ fontSize: 18, color: '#E24B4A' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{boss.name}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>每月 {boss.reset_day} 日重置</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#A32D2D', fontWeight: 500 }}>HP {100 - bossProgress}%</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 5 }}>
                  <span>${boss.current_amount?.toLocaleString()}</span>
                  <span>目標 ${boss.target_amount?.toLocaleString()}</span>
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
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={S.secLeft}><i className="fa-solid fa-medal" style={{ fontSize: 14, color: '#BA7517' }}></i>我的進度</div>
              </div>
              <div style={S.levelCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {member.avatar_url
                    ? <img src={member.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775', flexShrink: 0 }} />
                    : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#633806', border: '1.5px solid #FAC775', flexShrink: 0 }}>
                        {member.display_name?.[0]?.toUpperCase()}
                      </div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 3 }}>{member.display_name}</div>
                    <PokeballIcon level={member.level} size={14} />
                    <span style={{ fontSize: 11, color: '#BA7517', marginLeft: 4 }}>{member.level}</span>
                  </div>
                  {nextLevel && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#999' }}>距離{nextLevel.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#BA7517' }}>+{(nextLevel.min - member.points).toLocaleString()} 點</div>
                    </div>
                  )}
                </div>
                <div style={{ height: 7, background: '#f0e8d0', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${levelProgress}%`, background: 'linear-gradient(90deg,#378ADD,#BA7517)', borderRadius: 99 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#bbb', marginBottom: 10 }}>
                  <span>{member.points?.toLocaleString()} 點</span><span>{levelProgress}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {[{ num: member.points?.toLocaleString(), label: '累積積分' }, { num: member.login_streak, label: '連續登入' }, { num: `$${member.total_spent?.toLocaleString()}`, label: '累積消費' }].map((s, i) => (
                    <div key={i} style={S.lstat}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>{s.num}</div>
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 簽到 */}
          {weekLogins.length > 0 && (
            <div style={{ marginBottom: 100 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={S.secLeft}><i className="fa-solid fa-calendar-check" style={{ fontSize: 14, color: '#BA7517' }}></i>本週簽到</div>
                <span style={{ fontSize: 10, color: '#999' }}>連續7天簽到可額外+15分</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
                {weekLogins.map((d, i) => (
                  <div key={d.date} style={S.day(d.date === today, d.done)}>
                    <i className={`fa-solid ${d.done || d.date === today ? 'fa-check' : 'fa-circle'}`} style={{ fontSize: 10, opacity: d.done || d.date === today ? 1 : 0.3 }}></i>
                    <span>{dayNames[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 我要出貨 固定按鈕 ── */}
      <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: '0 20px', pointerEvents: 'none', zIndex: 50 }}>
        {currentOrder ? (
          // 有待出貨訂單：顯示狀態卡
          <div style={{ pointerEvents: 'auto', background: 'linear-gradient(135deg,#fdfaf4,#fff)', border: '0.5px solid #FAC775', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(186,117,23,0.15)' }}>
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
          // 封鎖中
          <div style={{ pointerEvents: 'auto', background: '#f8f8f8', border: '0.5px solid #e5e5e5', borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <i className="fa-solid fa-clock" style={{ fontSize: 18, color: '#ccc' }}></i>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#888' }}>出貨申請暫時停用</div>
              <div style={{ fontSize: 10, color: '#bbb' }}>取消後 {blockedDaysLeft} 天內無法再申請</div>
            </div>
          </div>
        ) : (
          // 正常狀態：出貨按鈕
          <button onClick={() => setShippingModal(true)} style={{ pointerEvents: 'auto', width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(186,117,23,0.35)', letterSpacing: '0.04em' }}>
            <i className="fa-solid fa-truck"></i> 我要出貨
          </button>
        )}
      </div>

      {/* ── 新聞彈窗 ── */}
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

      {/* ── 出貨申請 Modal ── */}
      {shippingModal && (
        <div onClick={() => setShippingModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: '0 0 32px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 16px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ fontSize: 17, fontWeight: 500, color: '#111', marginBottom: 4 }}>出貨申請</div>
              <div style={{ fontSize: 12, color: '#bbb', marginBottom: 20 }}>申請後由後台人員處理出貨</div>

              {shippingError && (
                <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{shippingError}</div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 5 }}>711 門市名稱 <span style={{ color: '#E24B4A' }}>*</span></label>
                <input value={shippingForm.store_name} onChange={e => setShippingForm({ ...shippingForm, store_name: e.target.value })}
                  placeholder="例：台北忠孝門市" style={inp} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 5 }}>收貨姓名 <span style={{ color: '#E24B4A' }}>*</span></label>
                <input value={shippingForm.recipient_name} onChange={e => setShippingForm({ ...shippingForm, recipient_name: e.target.value })}
                  placeholder="例：王小明" style={inp} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 5 }}>手機號碼 <span style={{ color: '#E24B4A' }}>*</span></label>
                <input value={shippingForm.phone} onChange={e => setShippingForm({ ...shippingForm, phone: e.target.value })}
                  placeholder="例：0912345678" type="tel" style={inp} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 5 }}>備註（選填）</label>
                <input value={shippingForm.note} onChange={e => setShippingForm({ ...shippingForm, note: e.target.value })}
                  placeholder="例：請勿摺疊" style={inp} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShippingModal(false)} style={{ flex: 1, padding: 12, border: '0.5px solid #f0e8d0', borderRadius: 10, fontSize: 14, color: '#888', background: '#fdfaf4', cursor: 'pointer' }}>取消</button>
                <button onClick={handleSubmitShipping} disabled={shippingSaving}
                  style={{ flex: 2, padding: 12, background: shippingSaving ? '#ccc' : 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer' }}>
                  {shippingSaving ? '申請中...' : '確認申請'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 取消出貨 確認 Modal ── */}
      {cancelModal && (
        <div onClick={() => setCancelModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 320, padding: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 20, color: '#E24B4A' }}></i>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#111', textAlign: 'center', marginBottom: 8 }}>確認取消出貨？</div>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 1.6, marginBottom: 18 }}>
              取消後 <strong style={{ color: '#E24B4A' }}>7 天內</strong>將無法再申請出貨
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCancelModal(false)} style={{ flex: 1, padding: 11, border: '0.5px solid #ddd', borderRadius: 10, fontSize: 13, color: '#666', background: 'transparent', cursor: 'pointer' }}>保留申請</button>
              <button onClick={handleCancelShipping} disabled={shippingSaving}
                style={{ flex: 1, padding: 11, background: shippingSaving ? '#ccc' : '#E24B4A', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'white', cursor: 'pointer' }}>
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
