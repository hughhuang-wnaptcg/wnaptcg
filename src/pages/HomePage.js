// src/pages/HomePage.js
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getLevel } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'
import LeaderboardSheet from '../components/LeaderboardSheet'
import { vibrate, VIBRATE } from '../lib/haptics'
import { playSound } from '../lib/sounds'
import CountUp from '../components/CountUp'
import { SkeletonPanel } from '../components/Skeleton'
import {
  BERRY_DAILY_LIMIT, berryKind, berrySvg, BERRY_POSITIONS,
  getActiveSession, getNextSession, fmtCountdown,
} from '../lib/berries'

const CDN = 'https://cdn.jsdelivr.net/gh/duiker101/pokemon-type-svg-icons@master/icons'

// 留言板：等級主題色（與 ProfilePage LEVEL_THEME 一致）
const BOARD_LEVEL_THEME = {
  '精靈球': { c: '#9A1F1F', bg: '#FFE3E3' },
  '超級球': { c: '#1A4A7A', bg: '#D6E6F8' },
  '高級球': { c: '#5A4A0A', bg: '#F5D04A' },
  '豪華球': { c: '#F5D060', bg: '#3A2A1A' },
  '貴重球': { c: '#F5C0C0', bg: '#3A1A1A' },
  '究極球': { c: '#A0C8F0', bg: '#152540' },
  '大師球': { c: '#F5D060', bg: '#1A1A1A' },
}
// 高級球以上（每日 3 則）
const BOARD_VIP_LEVELS = ['高級球', '豪華球', '貴重球', '究極球', '大師球']

// ── 首頁 Hero 主題（統一暖白金，不再依球種換膚）──
// dark: 深色主題（文字翻淺色）。bg=背景漸層, accent=主色, name=主文字, sub=次文字,
// pill(bg/border/text)=「今日已獲得」膠囊, avatarBorder=頭像框, eyebrow=頂部英文標。
// 註：heroTheme() 一律回傳 HERO_DEFAULT，全站 Hero 統一暖白金。
//     球種換膚配色已停用；如日後想恢復，可參考共用檔 src/lib/heroTheme.js 的 HERO_THEME。
const HERO_DEFAULT = {
  dark: false,
  bg: 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)',
  accent: '#BA7517', name: '#2D1A00', sub: '#A07040', eyebrow: '#E07B00',
  pillBg: '#fff', pillBorder: '#FAC775', pillText: '#8B4A00', pillStar: '#E07B00',
  avatarBorder: '#FAC775', levelText: '#BA7517', wave: '#FFFBF2',
}
// 全站 Hero 統一暖白金：一律回傳 HERO_DEFAULT，不再依球種變色。
// 註：保留無參數簽名；呼叫端即使傳入 level（如 heroTheme(myLevel)）也會被忽略，不影響運作。
function heroTheme() {
  return HERO_DEFAULT
}

function boardLevelTheme(level) {
  return BOARD_LEVEL_THEME[level] || BOARD_LEVEL_THEME['精靈球']
}

// 留言時間顯示（相對時間）
function boardTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '剛剛'
  if (min < 60) return `${min} 分鐘前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小時前`
  const day = Math.floor(hr / 24)
  return `${day} 天前`
}

// 台灣時間當日 00:00 的 ISO（用於查當日留言數）
function taiwanTodayStartISO() {
  const now = new Date()
  const tw = new Date(now.getTime() + 8 * 3600000)
  const y = tw.getUTCFullYear(), m = tw.getUTCMonth(), d = tw.getUTCDate()
  const startUTC = Date.UTC(y, m, d, 0, 0, 0) - 8 * 3600000
  return new Date(startUTC).toISOString()
}

const TYPE_BY_WEEKDAY = {
  1: { type: 'water',    color: '#6890F0', name: '水',  label: '一' },
  2: { type: 'fire',     color: '#F08030', name: '火',  label: '二' },
  3: { type: 'grass',    color: '#78C850', name: '草',  label: '三' },
  4: { type: 'electric', color: '#F8D030', name: '電',  label: '四' },
  5: { type: 'psychic',  color: '#F85888', name: '超能', label: '五' },
  6: { type: 'fighting', color: '#C03028', name: '鬥',  label: '六' },
  0: { type: 'dragon',   color: '#7038F8', name: '龍',  label: '日' },
}

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
  const [liveItemCount, setLiveItemCount] = useState(0)
  const [loading, setLoading] = useState(true)   // 首頁初次載入骨架
  const [weekLogins, setWeekLogins] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const [todayPoints, setTodayPoints] = useState(0)
  const [showWeekCelebration, setShowWeekCelebration] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // 留言板
  const [boardMsgs, setBoardMsgs] = useState([])
  const [boardModal, setBoardModal] = useState(false)
  const [boardInput, setBoardInput] = useState('')
  const [boardSending, setBoardSending] = useState(false)
  const [boardError, setBoardError] = useState('')
  const [todayMsgCount, setTodayMsgCount] = useState(0)

  // 樹果採集
  const [berrySession, setBerrySession] = useState(null)   // 目前場次 { hour, dateStr, secondsLeft }
  const [berries, setBerries] = useState([])               // 這場 3 顆 [{ index, kind, points, claimed }]
  const [berrySecLeft, setBerrySecLeft] = useState(0)
  const [berryTodayCount, setBerryTodayCount] = useState(0)
  const [berryPop, setBerryPop] = useState(null)           // { index, points, kind } 採集後彈分動畫
  const [berryFx, setBerryFx] = useState(null)             // { index, kind: 'plus'|'minus' } 採集回饋特效
  const [berryClaiming, setBerryClaiming] = useState(false)
  const [berryDismissed, setBerryDismissed] = useState(false)  // ✕ 逃生門：本場手動關閉
  const [berryFadeOut, setBerryFadeOut] = useState(false)      // 採完 3 顆自動淡出中

  const [shippingModal, setShippingModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [cannotOrderUntil, setCannotOrderUntil] = useState(null)
  const [shippingForm, setShippingForm] = useState({ store_name: '', recipient_name: '', phone: '', note: '' })
  const [shippingSaving, setShippingSaving] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const [makeUpModal, setMakeUpModal] = useState(null)
  const [makeUpSaving, setMakeUpSaving] = useState(false)
  const [makeUpError, setMakeUpError] = useState('')

  // 留言額度：高級球以上每日 3 則，其餘 1 則
  const myLevel = member ? getLevel(member.points) : '精靈球'
  const dailyLimit = BOARD_VIP_LEVELS.includes(myLevel) ? 3 : 1
  const remainingMsgs = Math.max(0, dailyLimit - todayMsgCount)

  // 首頁 Hero：統一暖白金（不再依球種換膚）
  const hero = heroTheme(myLevel)

  useEffect(() => {
    if (loginResult?.weekComplete) {
      setTimeout(() => {
        setShowWeekCelebration(true)
        playSound('boss_defeated')
        vibrate(VIBRATE.weekComplete)
        setTimeout(() => setShowWeekCelebration(false), 4000)
      }, 2800)
    }
  }, [loginResult])

  async function fetchBoardMessages() {
    const { data } = await supabase.from('board_messages')
      .select('*').order('created_at', { ascending: false }).limit(30)
    setBoardMsgs(data || [])
  }

  async function fetchTodayMsgCount(memberId) {
    const startISO = taiwanTodayStartISO()
    const { count } = await supabase.from('board_messages')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .gte('created_at', startISO)
    setTodayMsgCount(count || 0)
  }

  // ── 樹果：載入目前場次與果況 ──────────────────────────────
  const loadBerries = useCallback(async () => {
    if (!member) return
    const session = getActiveSession()
    setBerrySession(session)
    if (!session) { setBerries([]); return }
    // 新場次重置「手動關閉 / 淡出」狀態
    setBerryDismissed(false)
    setBerryFadeOut(false)
    // 今日已採數
    const { count } = await supabase.from('berry_claims')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', member.id).eq('claim_date', session.dateStr)
    setBerryTodayCount(count || 0)
    // 向後端要這場 3 顆（所見即所得）
    const { data, error } = await supabase.rpc('peek_berries', {
      p_member_id: member.id,
      p_claim_date: session.dateStr,
      p_session_hour: session.hour,
    })
    if (!error && data?.ok) setBerries(data.berries || [])
    else setBerries([])
  }, [member])

  // 採一顆果
  async function handleClaimBerry(berry) {
    if (!member || berry.claimed || berryClaiming || !berrySession) return
    if (berryTodayCount >= BERRY_DAILY_LIMIT) {
      playSound('error_points'); vibrate(VIBRATE.error); return
    }
    setBerryClaiming(true)
    try {
      const { data, error } = await supabase.rpc('claim_berry', {
        p_member_id: member.id,
        p_claim_date: berrySession.dateStr,
        p_session_hour: berrySession.hour,
        p_berry_index: berry.index,
      })
      if (error || !data?.ok) {
        playSound('error_system'); vibrate(VIBRATE.error)
        setBerryClaiming(false)
        return
      }
      const gained = data.points
      // 彈分動畫 + 正負分特效（金光 / 碎裂）
      setBerryPop({ index: berry.index, points: gained, kind: data.kind })
      setBerryFx({ index: berry.index, kind: gained >= 0 ? 'plus' : 'minus' })
      setTimeout(() => setBerryPop(null), 1100)
      setTimeout(() => setBerryFx(null), 1100)
      // 正負分別回饋
      if (gained >= 0) { playSound('checkin_success'); vibrate(VIBRATE.success) }
      else { playSound('error_points'); vibrate(VIBRATE.error) }
      // 標記該果已採
      const nextBerries = berries.map(b => b.index === berry.index ? { ...b, claimed: true } : b)
      setBerries(nextBerries)
      setBerryTodayCount(c => c + 1)
      // 同步會員積分（後端已是扣到 0 後的值）
      if (typeof data.new_points === 'number') {
        const newLevel = getLevel(data.new_points)
        setMember({ ...member, points: data.new_points, level: newLevel })
      }
      // 採完當場全部 → 自動淡出消失
      if (nextBerries.length > 0 && nextBerries.every(b => b.claimed)) {
        setTimeout(() => setBerryFadeOut(true), 700)
      }
    } catch {
      playSound('error_system'); vibrate(VIBRATE.error)
    }
    setBerryClaiming(false)
  }

  // ✕ 逃生門：手動關閉本場覆蓋層
  function dismissBerries() {
    playSound('modal_close'); vibrate(VIBRATE.light)
    setBerryFadeOut(true)
  }

  const fetchData = useCallback(async () => {
    const [{ data: bossData }, { data: cardsData }, { data: settingsData }, { count: liveCount }] = await Promise.all([
      supabase.from('boss_challenges').select('*').eq('is_active', true).single(),
      supabase.from('cards').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('settings').select('*'),
      supabase.from('menu_items').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])
    setBoss(bossData)
    setRecentCards(cardsData || [])
    setLiveItemCount(liveCount || 0)
    if (settingsData) {
      const s = {}
      settingsData.forEach(d => { try { s[d.key] = JSON.parse(d.value) } catch { s[d.key] = d.value } })
      if (s.announcement) setAnnouncement(s.announcement)
    }
    await fetchBoardMessages()
    if (member) {
      const today = new Date().toISOString().split('T')[0]
      const { data: loginData } = await supabase.from('point_logs')
        .select('points').eq('member_id', member.id)
        .gte('created_at', today).in('type', ['login', 'streak_bonus'])
      setTodayPoints((loginData || []).reduce((s, l) => s + l.points, 0))
      await fetchWeekLogins(member.id)
      await fetchShippingStatus(member.id)
      await fetchTodayMsgCount(member.id)
      await loadBerries()
    }
    setLoading(false)
  }, [member, loadBerries])

  async function fetchWeekLogins(memberId) {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const weekday = d.getDay()
      days.push({ date: dateStr, weekday })
    }
    const dateStrs = days.map(d => d.date)
    const { data: weekData } = await supabase.from('daily_logins')
      .select('login_date').eq('member_id', memberId).in('login_date', dateStrs)
    const loginDates = new Set((weekData || []).map(l => l.login_date))
    setWeekLogins(days.map(d => ({
      date: d.date, weekday: d.weekday,
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

  // 樹果倒數計時：每秒更新，歸零時重新載入場次
  useEffect(() => {
    if (!berrySession) { setBerrySecLeft(0); return }
    setBerrySecLeft(berrySession.secondsLeft)
    const t = setInterval(() => {
      setBerrySecLeft(prev => {
        if (prev <= 1) {
          clearInterval(t)
          loadBerries()  // 場次結束，重新判斷
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [berrySession, loadBerries])

  // 每 30 秒輕量檢查是否進入新場次（使用者停在首頁時也能等到整點）
  useEffect(() => {
    if (!member) return
    const t = setInterval(() => {
      const s = getActiveSession()
      const active = !!s
      const wasActive = !!berrySession
      if (active !== wasActive || (s && berrySession && s.hour !== berrySession.hour)) {
        loadBerries()
      }
    }, 30000)
    return () => clearInterval(t)
  }, [member, berrySession, loadBerries])

  const { scrollRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd, THRESHOLD } = usePullToRefresh(fetchData)

  function openBoardModal() {
    if (!member) { playSound('error_general'); vibrate(VIBRATE.error); return }
    if (remainingMsgs <= 0) {
      playSound('error_points'); vibrate(VIBRATE.error)
      setBoardError('今日留言次數已達上限')
      return
    }
    setBoardError(''); setBoardInput('')
    playSound('modal_open'); vibrate(VIBRATE.light)
    setBoardModal(true)
  }

  function closeBoardModal() {
    playSound('modal_close')
    setBoardModal(false); setBoardError('')
  }

  async function handleSendMessage() {
    if (!member) return
    const text = boardInput.trim()
    if (!text) { setBoardError('請輸入留言內容'); playSound('error_general'); vibrate(VIBRATE.error); return }
    if (text.length > 15) { setBoardError('留言不可超過 15 字'); playSound('error_general'); vibrate(VIBRATE.error); return }
    if (remainingMsgs <= 0) { setBoardError('今日留言次數已達上限'); playSound('error_points'); vibrate(VIBRATE.error); return }
    setBoardSending(true); setBoardError('')
    try {
      const level = getLevel(member.points)
      const { error } = await supabase.from('board_messages').insert({
        member_id: member.id,
        display_name: member.display_name || 'Trainer',
        avatar_url: member.avatar_url || null,
        level,
        message: text,
      })
      if (error) throw error
      playSound('checkin_success'); vibrate(VIBRATE.success)
      setBoardModal(false); setBoardInput('')
      await fetchBoardMessages()
      await fetchTodayMsgCount(member.id)
    } catch {
      setBoardError('留言失敗，請稍後再試')
      playSound('error_system'); vibrate(VIBRATE.error)
    }
    setBoardSending(false)
  }

  async function handleSubmitShipping() {
    if (!shippingForm.store_name.trim() || !shippingForm.recipient_name.trim() || !shippingForm.phone.trim()) {
      setShippingError('請填寫所有必填欄位'); playSound('error_general'); vibrate(VIBRATE.error); return
    }
    setShippingSaving(true); setShippingError('')
    const { error } = await supabase.from('shipping_orders').insert({
      member_id: member.id, store_name: shippingForm.store_name.trim(),
      recipient_name: shippingForm.recipient_name.trim(), phone: shippingForm.phone.trim(),
      note: shippingForm.note.trim(), status: 'pending',
    })
    if (error) { setShippingError('申請失敗，請稍後再試'); playSound('error_system'); vibrate(VIBRATE.error) }
    else { playSound('shop_redeem_success'); vibrate(VIBRATE.success); setShippingModal(false); await fetchShippingStatus(member.id) }
    setShippingSaving(false)
  }

  async function handleCancelShipping() {
    if (!currentOrder) return
    setShippingSaving(true)
    await supabase.from('shipping_orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', currentOrder.id)
    playSound('modal_close')
    setCancelModal(false); await fetchShippingStatus(member.id)
    setShippingSaving(false)
  }

  function openMakeUp(day) {
    const today = new Date().toISOString().split('T')[0]
    if (day.done || day.date >= today) return
    playSound('modal_open'); vibrate(VIBRATE.light)
    setMakeUpError(''); setMakeUpModal(day)
  }

  async function handleMakeUp() {
    if (!makeUpModal || !member) return
    if (member.points < 10) {
      setMakeUpError('積分不足 10 點，無法補簽'); playSound('error_points'); vibrate(VIBRATE.error); return
    }
    setMakeUpSaving(true); setMakeUpError('')
    try {
      const { error: insertErr } = await supabase.from('daily_logins').insert({ member_id: member.id, login_date: makeUpModal.date })
      if (insertErr && !insertErr.message?.includes('duplicate')) throw insertErr
      const newPoints = member.points - 10
      const newLevel = getLevel(newPoints)
      await supabase.from('members').update({ points: newPoints, level: newLevel }).eq('id', member.id)
      await supabase.from('point_logs').insert({ member_id: member.id, type: 'makeup', points: -10, note: `補簽 ${makeUpModal.date}` })
      setMember({ ...member, points: newPoints, level: newLevel })
      playSound('checkin_success'); vibrate(VIBRATE.makeUp)
      setMakeUpModal(null); await fetchWeekLogins(member.id)
    } catch { setMakeUpError('補簽失敗，請稍後再試'); playSound('error_system'); vibrate(VIBRATE.error) }
    setMakeUpSaving(false)
  }

  const bossProgress = boss ? Math.round((boss.current_amount / boss.target_amount) * 100) : 0
  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = (hour >= 6 && hour < 12) ? { text: '早安', icon: 'fa-sun' } : hour < 18 ? { text: '午安', icon: 'fa-sun' } : { text: '晚安', icon: 'fa-moon' }
  const isPulling = pullDistance > 0
  const isReadyToRelease = pullDistance >= THRESHOLD
  const blockedDaysLeft = cannotOrderUntil ? Math.ceil((cannotOrderUntil - new Date()) / (1000 * 60 * 60 * 24)) : 0
  const isWeekComplete = weekLogins.length === 7 && weekLogins.every(d => d.done)
  const nextSession = getNextSession()
  const berryLimitReached = berryTodayCount >= BERRY_DAILY_LIMIT
  // 樹果覆蓋層是否顯示：有場次、有果、未手動關閉、未淡出完成
  const showBerryOverlay = !!(member && berrySession && berries.length > 0 && !berryDismissed)

  const inp = { width: '100%', padding: '10px 12px', border: '0.5px solid #f0e8d0', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', background: '#fdfaf4', boxSizing: 'border-box' }

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#FFFBF2', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    hero: { background: 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)', padding: '22px 20px 20px', position: 'relative', overflow: 'hidden', borderBottom: 'none' },
    secLeft: { fontSize: 13, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 7 },
    typeBadge: (bg) => ({ width: 26, height: 26, borderRadius: 10, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 10 }),
    card: { border: 'none', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: '#fff', boxShadow: '0 4px 14px rgba(186,117,23,.10)' },
    bossCard: { border: 'none', borderRadius: 18, padding: 14, background: '#fff', boxShadow: '0 4px 16px rgba(186,117,23,.09)', marginBottom: 16 },
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
        <div style={{ ...S.hero, background: hero.bg }}>
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
          <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {member && (
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${hero.avatarBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,.2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hero.dark ? 'rgba(255,255,255,0.08)' : '#fff', flexShrink: 0 }}>
                <PokeballIcon level={member.level} size={36} />
              </div>
            )}
            <span style={{ fontSize: 7, color: hero.levelText, fontWeight: 700, letterSpacing: '0.05em' }}>{member?.level}</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: hero.eyebrow, letterSpacing: '0.12em', opacity: 0.7, marginBottom: 9 }}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: hero.name, lineHeight: 1.3 }}>
            {greeting.text}，<span style={{ color: hero.accent }}>{member?.display_name || 'Trainer'}</span>
          </div>
          <div style={{ fontSize: 13, color: hero.sub, margin: '3px 0 14px', fontWeight: 500 }}>今天要開什麼包？</div>
          {todayPoints > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: hero.pillBg, border: `2px solid ${hero.pillBorder}`, borderRadius: 999, padding: '6px 14px', fontSize: 12, color: hero.pillText, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,.10)' }}>
              <i className="fa-solid fa-star" style={{ color: hero.pillStar, fontSize: 12 }}></i>
              今日已獲得 <strong style={{ color: hero.pillStar, margin: '0 1px' }}>+<CountUp value={todayPoints} /></strong> 點
            </div>
          )}
          <svg style={{ position: 'absolute', bottom: -1, left: 0, right: 0, width: '100%' }} viewBox="0 0 390 22" preserveAspectRatio="none" height="22">
            <path d="M0 22 Q97 2 195 12 Q293 22 390 6 L390 22 Z" fill="#FFFBF2"/>
          </svg>
        </div>

        {/* ── 公告：沿用原設計 ── */}
        {announcement && (
          <div style={{ background: '#fffdf7', borderBottom: '1px solid #f5edd8', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <style>{`@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}`}</style>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#8B5A00', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '1.5px solid #E07B00', borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <i className="fa-solid fa-bullhorn" style={{ fontSize: 8 }}></i>公告
            </span>
            <div style={{ width: 1, height: 14, background: 'linear-gradient(180deg,transparent,#FAC775,transparent)', flexShrink: 0 }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, color: '#2D1A00', animation: 'marquee 12s linear infinite' }}>{announcement}</span>
            </div>
          </div>
        )}

        {/* ── 會員留言板（取代每日新聞） ── */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f5f0e8' }}>
          <div style={{ background: '#FFFBF2', border: '0.5px solid #F0E2C0', borderRadius: 16, padding: '14px 12px', overflow: 'hidden' }}>
            {/* 標題列 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-comment-dots" style={{ fontSize: 14, color: '#E07B00' }}></i>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#BA7517' }}>會員留言板</span>
              </div>
              <span style={{ fontSize: 10, color: '#B89A5E', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#06C755', display: 'inline-block' }} />即時輪播
              </span>
            </div>

            {/* 跑馬燈 */}
            {boardMsgs.length > 0 ? (
              <div style={{ position: 'relative', height: 74, overflow: 'hidden', marginBottom: 12 }}>
                <style>{`@keyframes boardScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
                <div style={{ display: 'flex', gap: 10, position: 'absolute', width: 'max-content', animation: boardMsgs.length >= 3 ? `boardScroll ${Math.max(boardMsgs.length * 2.2, 10)}s linear infinite` : 'none' }}>
                  {(boardMsgs.length >= 3 ? [...boardMsgs, ...boardMsgs] : boardMsgs).map((m, i) => {
                    const th = boardLevelTheme(m.level)
                    return (
                      <div key={i} style={{ flexShrink: 0, width: 204, background: '#fff', border: '0.5px solid #F0E2C0', borderRadius: 10, padding: '9px 11px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        {m.avatar_url
                          ? <img src={m.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #F0E2C0' }} />
                          : <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FAEEDA', color: '#633806', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{(m.display_name || '?').charAt(0)}</div>
                        }
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#3A2A10', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60 }}>{m.display_name}</span>
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: th.bg, color: th.c, whiteSpace: 'nowrap' }}>{m.level}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#5A4A30', lineHeight: 1.4, wordBreak: 'break-all' }}>{m.message}</div>
                          <div style={{ fontSize: 9, color: '#B89A5E', marginTop: 2 }}>{boardTimeAgo(m.created_at)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ height: 74, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12, color: '#C4A86A' }}>
                <i className="fa-solid fa-comment" style={{ fontSize: 20, opacity: 0.5 }}></i>
                <span style={{ fontSize: 11 }}>成為今天第一個留言的人吧！</span>
              </div>
            )}

            {/* 我要留言 按鈕 */}
            {remainingMsgs > 0 ? (
              <button onClick={openBoardModal} className="press-fx"
                style={{ width: '100%', background: 'linear-gradient(135deg,#BA7517,#E07B00)', color: '#fff', border: 'none', height: 40, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <i className="fa-solid fa-pen" style={{ fontSize: 13 }}></i>我要留言
                <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>（今日剩 {remainingMsgs} 則）</span>
              </button>
            ) : (
              <div style={{ width: '100%', background: '#F2EDE2', color: '#A89876', height: 40, borderRadius: 10, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: 12 }}></i>今日留言已達上限
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 20px 0' }}>

          {/* ── 直播下單區 + 積分排行榜 並排 ── */}
          <style>{`@keyframes homeLiveDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.72)}}
            @keyframes wnaSkShimmer{0%{background-position:-360px 0}100%{background-position:360px 0}}
            .wna-sk{background:linear-gradient(90deg,#f3ece0 25%,#faf5ec 50%,#f3ece0 75%);background-size:720px 100%;animation:wnaSkShimmer 1.4s ease infinite}`}</style>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 16 }}>

            <div
              onClick={() => { playSound('button_tap'); vibrate(VIBRATE.light); navigate('/shop?tab=live') }}
              className="press-fx-soft"
              style={{ background: 'linear-gradient(135deg,#1a1a1a,#2A2A2A)', border: '1px solid rgba(226,75,74,0.35)', borderRadius: 14, padding: '14px', cursor: 'pointer', boxShadow: '0 5px 18px rgba(0,0,0,.12)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
              <div style={{ position: 'absolute', top: -18, right: -14, width: 72, height: 72, borderRadius: '50%', background: 'radial-gradient(circle,rgba(226,75,74,.22),transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E24B4A', borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', animation: 'homeLiveDot 1s ease infinite' }} />
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>LIVE</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>直播下單區</span>
              </div>
              <div style={{ fontSize: 10, color: '#888', position: 'relative' }}>
                {liveItemCount > 0 ? `${liveItemCount} 件商品上架中，立即下單` : '等待直播商品上架'}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#E24B4A', fontSize: 11, fontWeight: 700, position: 'relative' }}>
                <i className="fa-solid fa-video" style={{ fontSize: 11 }}></i>
                進入
                <i className="fa-solid fa-chevron-right" style={{ fontSize: 9 }}></i>
              </div>
            </div>

            <div
              onClick={() => { playSound('modal_open'); vibrate(VIBRATE.light); setShowLeaderboard(true) }}
              className="press-fx-soft"
              style={{ background: 'linear-gradient(135deg,#FFF8EE,#FFFBF2)', border: '1px solid #F5E8C8', borderRadius: 14, padding: '12px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 2px 8px rgba(186,117,23,.07)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#BA7517,#D4A94A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-ranking-star" style={{ fontSize: 16, color: '#fff' }}></i>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#2D1A00', textAlign: 'center', lineHeight: 1.4 }}>積分<br/>排行榜</div>
            </div>
          </div>

          {/* 戰績牆 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={S.secLeft}>
              <span style={S.typeBadge('linear-gradient(135deg,#BA7517,#D4A94A)')}><i className="fa-solid fa-trophy"></i></span>
              戰績牆
            </div>
            <span style={{ fontSize: 11, color: '#ccc', cursor: 'pointer' }} onClick={() => { playSound('button_tap'); vibrate(VIBRATE.light); navigate('/wall') }}>全部 →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 16 }}>
            {loading ? (
              [0, 1, 2].map(i => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 14px rgba(186,117,23,.10)' }}>
                  <div className="wna-sk" style={{ aspectRatio: '3/4', width: '100%' }} />
                  <div style={{ padding: '6px 7px 8px' }}>
                    <div className="wna-sk" style={{ width: '75%', height: 8, borderRadius: 4, marginBottom: 4 }} />
                    <div className="wna-sk" style={{ width: '45%', height: 7, borderRadius: 4 }} />
                  </div>
                </div>
              ))
            ) : recentCards.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 0', background: '#FFFBF2', border: '0.5px dashed #F0E2C0', borderRadius: 16, color: '#C4A86A' }}>
                <i className="fa-solid fa-trophy" style={{ fontSize: 26, opacity: 0.4 }}></i>
                <span style={{ fontSize: 12 }}>還沒有開卡紀錄，快來開第一包！</span>
              </div>
            ) : (
              recentCards.map((card, idx) => (
                <div key={card.id} onClick={() => { playSound('button_tap'); vibrate(VIBRATE.light); navigate('/wall') }} className="press-fx-soft" style={S.card}>
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
              ))
            )}
          </div>

          {/* Boss */}
          {loading && !boss && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={S.secLeft}>
                  <span style={S.typeBadge('linear-gradient(135deg,#A32D2D,#E24B4A)')}><i className="fa-solid fa-shield"></i></span>
                  共同挑戰
                </div>
              </div>
              <SkeletonPanel height={92} padding="0" radius={18} />
            </>
          )}
          {boss && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={S.secLeft}>
                  <span style={S.typeBadge('linear-gradient(135deg,#A32D2D,#E24B4A)')}><i className="fa-solid fa-shield"></i></span>
                  共同挑戰
                </div>
                <span style={{ fontSize: 11, color: '#ccc', cursor: 'pointer' }} onClick={() => { playSound('button_tap'); vibrate(VIBRATE.light); navigate('/challenge') }}>詳情 →</span>
              </div>
              <div style={S.bossCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F09595', overflow: 'hidden', flexShrink: 0 }}>
                    {boss.image_url
                      ? <img src={boss.image_url} alt={boss.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
                      : null}
                    <i className="fa-solid fa-skull" style={{ fontSize: 18, color: '#E24B4A', display: boss.image_url ? 'none' : 'block' }}></i>
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

          {/* 本週簽到 */}
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
                <span style={{ fontSize: 9, color: '#bbb' }}>7天全勤 +15積分</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {weekLogins.map((d) => {
                  const isToday = d.date === today
                  const canMakeUp = !d.done && !isToday && !d.isFuture
                  const tc = d.typeConfig
                  const bg = d.done
                    ? (isToday ? '#FCEBEB' : 'linear-gradient(135deg,#FAEEDA,#FFF3D0)')
                    : d.isFuture ? '#f5f5f5' : isToday ? '#fff5f5' : '#f8f5f0'
                  const borderColor = d.done
                    ? (isToday ? '#F09595' : '#FAC775')
                    : d.isFuture ? '#eee' : isToday ? '#F09595' : canMakeUp ? '#e5ddd0' : '#eee'
                  return (
                    <div key={d.date} onClick={() => canMakeUp && openMakeUp(d)} className={canMakeUp ? 'press-fx' : ''}
                      style={{ aspectRatio: 1, borderRadius: 9, background: bg, border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: canMakeUp ? 'pointer' : 'default', position: 'relative', transition: 'transform 0.1s' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 10, background: d.done ? tc.color : d.isFuture ? '#ddd' : isToday ? tc.color : '#d0c8be', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: d.done ? 1 : d.isFuture ? 0.3 : isToday ? 0.35 : 0.45 }}>
                        <img src={`${CDN}/${tc.type}.svg`} alt={tc.name} style={{ width: 13, height: 13 }} />
                      </div>
                      <span style={{ fontSize: 8, fontWeight: 700, color: d.done ? (isToday ? '#7A1A1A' : '#7A4A00') : d.isFuture ? '#ccc' : '#bbb' }}>{tc.label}</span>
                      {canMakeUp && <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: '#BA7517', opacity: 0.6 }} />}
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

      {/* ════════════ 樹果飄落覆蓋層（全螢幕、緩慢飄落、不擋操作、採完自動淡出、✕ 逃生門）════════════ */}
      {showBerryOverlay && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 80, maxWidth: 390, margin: '0 auto',
            opacity: berryFadeOut ? 0 : 1,
            transition: 'opacity 0.6s ease',
            pointerEvents: 'none',   // 整層不擋；只有果實/按鈕自己開啟點擊
          }}
          onTransitionEnd={() => { if (berryFadeOut) { setBerryDismissed(true); setBerryFadeOut(false) } }}
        >
          <style>{`
            @keyframes berryDrift{0%{transform:translateY(-90px) translateX(0) rotate(-8deg);opacity:0}8%{opacity:1}100%{transform:translateY(var(--fall)) translateX(var(--sway)) rotate(8deg);opacity:1}}
            @keyframes berryBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-7px) rotate(3deg)}}
            @keyframes berryGlowPulse{0%,100%{filter:drop-shadow(0 4px 6px rgba(0,0,0,.18))}50%{filter:drop-shadow(0 4px 6px rgba(0,0,0,.18)) drop-shadow(0 0 14px rgba(245,208,96,.95))}}
            @keyframes berryGlowDevil{0%,100%{filter:drop-shadow(0 4px 6px rgba(0,0,0,.2))}50%{filter:drop-shadow(0 4px 6px rgba(0,0,0,.2)) drop-shadow(0 0 14px rgba(190,100,230,.95))}}
            @keyframes berryPopUp{0%{transform:translateX(-50%) translateY(0);opacity:0}20%{opacity:1}100%{transform:translateX(-50%) translateY(-44px);opacity:0}}
            @keyframes bFxHappy{0%{transform:scale(1)}30%{transform:scale(1.25) rotate(-5deg)}60%{transform:scale(1.1) rotate(5deg)}100%{transform:scale(0);opacity:0}}
            @keyframes bFxBreak{0%{transform:scale(1);filter:saturate(1)}25%{transform:scale(1.15) translateY(-3px)}40%{transform:scale(.9) translateX(-3px);filter:saturate(.3)}50%{transform:scale(.95) translateX(3px)}100%{transform:scale(.7);opacity:0;filter:saturate(0) brightness(.6)}}
            @keyframes bFxBurst{0%{transform:translate(-50%,-50%) scale(0);opacity:0}30%{transform:translate(-50%,-50%) scale(1.3);opacity:.9}100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
            @keyframes bFxRay{0%{transform:rotate(var(--rot)) scaleY(0);opacity:0}30%{opacity:1}100%{transform:rotate(var(--rot)) scaleY(1.4);opacity:0}}
            @keyframes bFxSpark{0%{transform:translate(0,0) scale(0);opacity:0}40%{opacity:1;transform:translate(var(--s2x),var(--s2y)) scale(1)}100%{opacity:0;transform:translate(var(--s3x),var(--s3y)) scale(.3)}}
            @keyframes bFxShard{0%{transform:translate(-50%,-50%) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(var(--shx),var(--shy)) rotate(var(--shr));opacity:0}}
            @keyframes bFxShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
          `}</style>

          {/* 柔光罩（主頁輕微變淡，果實更跳出；不擋點擊） */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,251,242,0.42)', pointerEvents: 'none' }} />

          {/* 頂部標籤 + 倒數（按鈕可點） */}
          <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3, pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.9)', border: '1px solid #FAC775', borderRadius: 99, padding: '5px 12px', boxShadow: '0 2px 8px rgba(186,117,23,.12)' }}>
              <i className="fa-solid fa-seedling" style={{ fontSize: 12, color: '#3B6D11' }}></i>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#BA7517' }}>樹果飄落中</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.9)', border: '1px solid #F0E2C0', borderRadius: 99, padding: '5px 11px', boxShadow: '0 2px 8px rgba(186,117,23,.1)' }}>
                <i className="fa-solid fa-clock" style={{ fontSize: 11, color: '#E07B00' }}></i>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8B5A00' }}>剩 {fmtCountdown(berrySecLeft)}</span>
              </div>
              {/* ✕ 逃生門 */}
              <button onClick={dismissBerries} aria-label="稍後再採" className="press-fx"
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #F0E2C0', background: 'rgba(255,255,255,0.9)', color: '#A07040', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(186,117,23,.1)', padding: 0, pointerEvents: 'auto' }}>
                <i className="fa-solid fa-xmark" style={{ fontSize: 14 }}></i>
              </button>
            </div>
          </div>

          {/* 樹果們（飄落；只有果實本身可點，其餘穿透到底下主頁） */}
          {berries.map((b) => {
            const k = berryKind(b.kind)
            const pos = BERRY_POSITIONS[b.index % BERRY_POSITIONS.length]
            const claimed = b.claimed
            const svg = berrySvg(b.kind, 58, `hp${b.index}`)
            const glowAnim = k.glow
              ? (b.kind === 'super_devil' ? ', berryGlowDevil 1.6s ease-in-out infinite' : ', berryGlowPulse 1.6s ease-in-out infinite')
              : ''
            const fx = berryFx && berryFx.index === b.index ? berryFx.kind : null
            return (
              <div key={b.index}
                onClick={() => !claimed && !berryLimitReached && handleClaimBerry(b)}
                style={{
                  position: 'absolute', left: `${pos.x}%`, top: 0,
                  width: 58, cursor: claimed || berryLimitReached ? 'default' : 'pointer',
                  zIndex: 2,
                  opacity: claimed && !fx ? 0 : 1,
                  transition: 'opacity 0.5s ease',
                  pointerEvents: claimed ? 'none' : 'auto',
                  animation: fx === 'minus' ? 'bFxShake 0.5s ease' : 'none',
                  '--fall': `${pos.fall}px`, '--sway': `${pos.sway}px`,
                }}>
                {/* 果體（飄落 / 採集後金光彈起或碎裂） */}
                <div style={{
                  animation: claimed
                    ? (fx === 'plus' ? 'bFxHappy 0.9s ease forwards' : fx === 'minus' ? 'bFxBreak 1s ease forwards' : 'none')
                    : `berryDrift ${pos.dur}s cubic-bezier(.45,.05,.55,.95) ${pos.delay}s forwards${glowAnim}`,
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.15))',
                }} dangerouslySetInnerHTML={{ __html: svg }} />

                {/* 正分：金光放射 + 火花 */}
                {fx === 'plus' && (
                  <>
                    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 70, height: 70, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,230,120,.9),rgba(255,200,80,.3) 60%,transparent 75%)', animation: 'bFxBurst 0.9s ease forwards', pointerEvents: 'none', zIndex: 5 }} />
                    {[0, 60, 120, 180, 240, 300].map(rot => (
                      <div key={rot} style={{ position: 'absolute', left: '50%', top: '50%', width: 3, height: 34, marginLeft: -1.5, marginTop: -17, background: 'linear-gradient(rgba(255,230,120,.95),transparent)', transformOrigin: 'center bottom', '--rot': `${rot}deg`, animation: 'bFxRay 0.9s ease forwards', pointerEvents: 'none', zIndex: 5 }} />
                    ))}
                    {[['-26px','-20px','-38px','-30px'],['24px','-22px','34px','-34px'],['18px','18px','28px','30px'],['-20px','16px','-30px','26px']].map((s, si) => (
                      <div key={si} style={{ position: 'absolute', left: '50%', top: '50%', width: 6, height: 6, borderRadius: '50%', background: ['#FFE066','#FFF0A0','#FAC775','#FFE066'][si], '--s2x': s[0], '--s2y': s[1], '--s3x': s[2], '--s3y': s[3], animation: 'bFxSpark 1s ease forwards', pointerEvents: 'none', zIndex: 6 }} />
                    ))}
                  </>
                )}

                {/* 負分：碎片飛散 */}
                {fx === 'minus' && (
                  [['-30px','-22px','120deg','#3A3A3E',8],['28px','-26px','-140deg','#5A5A62',7],['32px','18px','90deg','#2A2A2E',6],['-26px','22px','-100deg','#4A4A50',8],['0px','-34px','160deg','#1A1A1C',5]].map((s, si) => (
                    <div key={si} style={{ position: 'absolute', left: '50%', top: '50%', width: s[4], height: s[4], background: s[3], borderRadius: 2, '--shx': s[0], '--shy': s[1], '--shr': s[2], animation: 'bFxShard 1s ease forwards', pointerEvents: 'none', zIndex: 5 }} />
                  ))
                )}

                {/* 彈分動畫 */}
                {berryPop && berryPop.index === b.index && (
                  <div style={{ position: 'absolute', left: '50%', top: 0, fontSize: 20, fontWeight: 800, color: berryPop.points >= 0 ? '#3B6D11' : '#A32D2D', animation: 'berryPopUp 1.1s ease forwards', whiteSpace: 'nowrap', zIndex: 7, pointerEvents: 'none', textShadow: '0 1px 3px rgba(255,255,255,.9)' }}>
                    {berryPop.points >= 0 ? '+' : ''}{berryPop.points}
                  </div>
                )}
              </div>
            )
          })}

          {/* 底部：今日已採 / 上限（不擋點擊） */}
          <div style={{ position: 'absolute', bottom: 130, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>
            {berryLimitReached ? (
              <span style={{ fontSize: 12, color: '#A89876', background: 'rgba(255,255,255,0.92)', borderRadius: 99, padding: '6px 16px', boxShadow: '0 2px 10px rgba(186,117,23,.12)' }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: 5 }}></i>今日採集已達上限
              </span>
            ) : (
              <span style={{ fontSize: 12, color: '#8B5A00', background: 'rgba(255,255,255,0.92)', borderRadius: 99, padding: '6px 16px', boxShadow: '0 2px 10px rgba(186,117,23,.12)' }}>
                點擊樹果採集　·　今日已採 <strong style={{ color: '#E07B00' }}>{berryTodayCount}</strong> / {BERRY_DAILY_LIMIT} 顆
              </span>
            )}
          </div>
        </div>
      )}

      {/* 我要出貨 固定按鈕（浮動橫幅） */}
      <style>{`
        @keyframes shipBarIn{0%{opacity:0;transform:translateY(16px) scale(0.97)}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes shipBarGlow{0%,100%{box-shadow:0 4px 20px rgba(186,117,23,.35),0 0 0 0 rgba(224,123,0,0.5)}50%{box-shadow:0 6px 24px rgba(186,117,23,.45),0 0 0 8px rgba(224,123,0,0)}}
        @keyframes shipIconBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
      `}</style>
      <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: '0 20px', pointerEvents: 'none', zIndex: 90 }}>
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
              <span onClick={() => { playSound('modal_open'); vibrate(VIBRATE.light); setCancelModal(true) }} style={{ fontSize: 10, color: '#A32D2D', cursor: 'pointer', textDecoration: 'underline' }}>取消申請</span>
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
          <button onClick={() => { playSound('modal_open'); vibrate(VIBRATE.light); setShippingModal(true) }} className="press-fx" style={{ pointerEvents: 'auto', width: '100%', padding: '14px 0', background: 'linear-gradient(135deg,#BA7517,#E07B00)', border: '1.5px solid #FFF3D0', borderRadius: 14, fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, animation: 'shipBarIn 0.32s cubic-bezier(0.34,1.56,0.64,1), shipBarGlow 2.2s ease infinite' }}>
            <i className="fa-solid fa-truck" style={{ animation: 'shipIconBob 1.6s ease infinite' }}></i> 我要出貨
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

      {/* 排行榜 Sheet */}
      {showLeaderboard && (
        <div onClick={() => { playSound('modal_close'); setShowLeaderboard(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, height: '85vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <LeaderboardSheet onClose={() => { playSound('modal_close'); setShowLeaderboard(false) }} currentMemberId={member?.id} />
          </div>
        </div>
      )}

      {/* 留言 Modal */}
      {boardModal && (
        <div onClick={closeBoardModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: '0 0 28px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 16px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#2D1A00' }}>留下你的留言</div>
                <span style={{ fontSize: 11, color: '#B89A5E' }}>今日剩 <span style={{ color: '#E07B00', fontWeight: 700 }}>{remainingMsgs}</span> 則</span>
              </div>
              {boardError && <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{boardError}</div>}
              <input
                value={boardInput}
                onChange={e => setBoardInput(e.target.value)}
                placeholder="說點什麼…（最多 15 字）"
                style={{ ...inp, borderColor: boardInput.length > 15 ? '#E24B4A' : '#f0e8d0' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: '#E24B4A', opacity: boardInput.length > 15 ? 1 : 0, transition: 'opacity 0.15s' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 4 }}></i>超過 15 字了，請刪減
                </span>
                <span style={{ fontSize: 11, color: boardInput.length > 15 ? '#E24B4A' : boardInput.length >= 15 ? '#E07B00' : '#bbb', fontWeight: boardInput.length > 15 ? 700 : 400 }}>{boardInput.length} / 15</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={closeBoardModal} className="press-fx" style={{ flex: 1, padding: 12, border: '1px solid #f0e8d0', borderRadius: 10, fontSize: 14, color: '#888', background: '#fdfaf4', cursor: 'pointer' }}>取消</button>
                <button onClick={handleSendMessage} disabled={boardSending || !boardInput.trim() || boardInput.length > 15} className="press-fx"
                  style={{ flex: 2, padding: 12, background: boardSending || !boardInput.trim() || boardInput.length > 15 ? '#ccc' : 'linear-gradient(135deg,#BA7517,#E07B00)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: boardSending || !boardInput.trim() || boardInput.length > 15 ? 'not-allowed' : 'pointer' }}>
                  {boardSending ? '送出中...' : '送出留言'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 補簽 Modal */}
      {makeUpModal && (
        <div onClick={() => { playSound('modal_close'); setMakeUpModal(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 300, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>補簽確認</div>
              <span onClick={() => { playSound('modal_close'); setMakeUpModal(null) }} style={{ fontSize: 18, color: '#aaa', cursor: 'pointer' }}>✕</span>
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
              <button onClick={() => { playSound('modal_close'); setMakeUpModal(null) }} className="press-fx" style={{ flex: 1, padding: 10, border: '1px solid #f0e8d0', borderRadius: 10, fontSize: 13, color: '#888', background: '#fdfaf4', cursor: 'pointer' }}>取消</button>
              <button onClick={handleMakeUp} disabled={makeUpSaving || (member?.points || 0) < 10} className="press-fx"
                style={{ flex: 2, padding: 10, background: makeUpSaving || (member?.points || 0) < 10 ? '#ccc' : 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                {makeUpSaving ? '補簽中...' : '確認補簽 (-10點)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 出貨 Modal */}
      {shippingModal && (
        <div onClick={() => { playSound('modal_close'); setShippingModal(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
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
                <button onClick={() => { playSound('modal_close'); setShippingModal(false) }} className="press-fx" style={{ flex: 1, padding: 12, border: '1px solid #f0e8d0', borderRadius: 10, fontSize: 14, color: '#888', background: '#fdfaf4', cursor: 'pointer' }}>取消</button>
                <button onClick={handleSubmitShipping} disabled={shippingSaving} className="press-fx" style={{ flex: 2, padding: 12, background: shippingSaving ? '#ccc' : 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  {shippingSaving ? '申請中...' : '確認申請'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 取消出貨 Modal */}
      {cancelModal && (
        <div onClick={() => { playSound('modal_close'); setCancelModal(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 320, padding: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 20, color: '#E24B4A' }}></i>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', textAlign: 'center', marginBottom: 8 }}>確認取消出貨？</div>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 1.6, marginBottom: 18 }}>
              取消後 <strong style={{ color: '#E24B4A' }}>7 天內</strong>將無法再申請出貨
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { playSound('modal_close'); setCancelModal(false) }} className="press-fx" style={{ flex: 1, padding: 11, border: '1px solid #ddd', borderRadius: 10, fontSize: 13, color: '#666', background: 'transparent', cursor: 'pointer' }}>保留申請</button>
              <button onClick={handleCancelShipping} disabled={shippingSaving} className="press-fx" style={{ flex: 1, padding: 11, background: shippingSaving ? '#ccc' : '#E24B4A', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
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
