// src/pages/ProfilePage.js
import React, { useEffect, useRef, useState } from 'react'
import { supabase, LEVELS, getNextLevel, RARITY_COLORS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'
import { playSound, SoundToggle } from '../lib/sounds'
import { vibrate, VIBRATE } from '../lib/haptics'
import { useToast } from '../components/Toast'
import CountUp from '../components/CountUp'

const CDN = 'https://cdn.jsdelivr.net/gh/duiker101/pokemon-type-svg-icons@master/icons'
const TYPE_BY_WEEKDAY = {
  1: { type: 'water',    color: '#6890F0', name: '水',  label: '一' },
  2: { type: 'fire',     color: '#F08030', name: '火',  label: '二' },
  3: { type: 'grass',    color: '#78C850', name: '草',  label: '三' },
  4: { type: 'electric', color: '#F8D030', name: '電',  label: '四' },
  5: { type: 'psychic',  color: '#F85888', name: '超能', label: '五' },
  6: { type: 'fighting', color: '#C03028', name: '鬥',  label: '六' },
  0: { type: 'dragon',   color: '#7038F8', name: '龍',  label: '日' },
}
const GRADING_STATUS = {
  submitted: { label: '已送出', color: '#E07B00', bg: '#FFF3E0' },
  grading:   { label: '鑑定中', color: '#1976D2', bg: '#E3F2FD' },
  returned:  { label: '已取回', color: '#388E3C', bg: '#E8F5E9' },
  sold:      { label: '已售出', color: '#757575', bg: '#F5F5F5' },
}

const AVATAR_ALLOWED_LEVELS = ['高級球', '豪華球', '貴重球', '究極球', '大師球']

// ── 等級會員卡主題 ──
// 依等級給「會員卡」一套配色：背景漸層、邊框、主文字、次文字、徽章光暈、
// 是否深色卡（dark=true 用淺字）。找不到時 fallback general。
const LEVEL_THEME = {
  精靈球: { bg: 'linear-gradient(135deg,#FFFBF2,#FFF3D8)', border: '#F5E8C8', name: '#2D1A00', sub: '#A07040', accent: '#E07B00', glow: 'rgba(224,123,0,0.18)', dark: false },
  超級球: { bg: 'linear-gradient(135deg,#EAF2FC,#D6E6F8)', border: '#AFCDEE', name: '#13355C', sub: '#4C6E96', accent: '#2F6FB5', glow: 'rgba(55,138,221,0.22)', dark: false },
  高級球: { bg: 'linear-gradient(135deg,#FBF4E6,#F3E3C2)', border: '#E6C27A', name: '#3A2A0A', sub: '#7A5C2E', accent: '#B07A1E', glow: 'rgba(176,122,30,0.22)', dark: false },
  豪華球: { bg: 'linear-gradient(135deg,#2A1B10,#3A2415)', border: '#BA7517', name: '#F7E4C0', sub: '#C9A06A', accent: '#EF9F27', glow: 'rgba(239,159,39,0.30)', dark: true },
  貴重球: { bg: 'linear-gradient(135deg,#2A1414,#3B1C1C)', border: '#A32D2D', name: '#F7D6D0', sub: '#C98A82', accent: '#E24B4A', glow: 'rgba(226,75,74,0.30)', dark: true },
  究極球: { bg: 'linear-gradient(135deg,#10204A,#1B2F66)', border: '#4466DD', name: '#CFE0FF', sub: '#8FA8DD', accent: '#6E9BFF', glow: 'rgba(110,155,255,0.32)', dark: true },
  大師球: { bg: 'linear-gradient(135deg,#1A1A1A,#2A2030)', border: '#B8860B', name: '#F5D060', sub: '#B6A06A', accent: '#F5D060', glow: 'rgba(245,208,96,0.38)', dark: true },
}
function levelTheme(level) {
  return LEVEL_THEME[level] || LEVEL_THEME['精靈球']
}

// ── 展示卡稀有度光暈 ──
// UR=金、HR/SSR=彩虹、SAR/CSR=黑金、SR/AR/CHR=白、PROMO/Other=黑。
// kind: solid（單色光暈）/ rainbow（彩虹）。color 為光暈主色。
const RARITY_GLOW = {
  UR:    { kind: 'solid',   color: '#F5C518', ring: '#F5C518' },
  HR:    { kind: 'rainbow', color: '#ff5e6c', ring: '#ff9a3d' },
  SSR:   { kind: 'rainbow', color: '#ff5e6c', ring: '#ff9a3d' },
  SAR:   { kind: 'solid',   color: '#C9A227', ring: '#1a1a1a' },
  CSR:   { kind: 'solid',   color: '#C9A227', ring: '#1a1a1a' },
  SR:    { kind: 'solid',   color: '#FFFFFF', ring: '#E8E8E8' },
  AR:    { kind: 'solid',   color: '#FFFFFF', ring: '#E8E8E8' },
  CHR:   { kind: 'solid',   color: '#FFFFFF', ring: '#E8E8E8' },
  PROMO: { kind: 'solid',   color: '#1a1a1a', ring: '#1a1a1a' },
  Other: { kind: 'solid',   color: '#1a1a1a', ring: '#1a1a1a' },
}
function rarityGlow(rarity) {
  return RARITY_GLOW[rarity] || RARITY_GLOW.Other
}

export default function ProfilePage() {
  const { member, setMember, signOut } = useAuth()
  const toast = useToast()
  const [profileTab, setProfileTab] = useState('home')
  const [logs, setLogs] = useState([])
  const [weekLogins, setWeekLogins] = useState([])
  const [shippingOrders, setShippingOrders] = useState([])
  const [gradings, setGradings] = useState([])
  const [myCards, setMyCards] = useState([])
  const [showcaseCards, setShowcaseCards] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showBenefits, setShowBenefits] = useState(false)
  const [showShipping, setShowShipping] = useState(false)
  const [showGrading, setShowGrading] = useState(false)
  const [showCardPicker, setShowCardPicker] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [restoringAvatar, setRestoringAvatar] = useState(false)
  const avatarFileRef = useRef()

  useEffect(() => { if (member) fetchData() }, [member])

  async function fetchData() {
    const { data: logData } = await supabase.from('point_logs')
      .select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(15)
    setLogs(logData || [])

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
      days.push({ date: dateStr, weekday: d.getDay(), isFuture: dateStr > todayStr })
    }
    const { data: loginData } = await supabase.from('daily_logins')
      .select('login_date').eq('member_id', member.id).in('login_date', days.map(d => d.date))
    const loginDates = new Set((loginData || []).map(l => l.login_date))
    setWeekLogins(days.map(d => ({
      ...d, done: loginDates.has(d.date), typeConfig: TYPE_BY_WEEKDAY[d.weekday],
    })))

    const { data: shippingData } = await supabase.from('shipping_orders')
      .select('*').eq('member_id', member.id).order('created_at', { ascending: false })
    setShippingOrders(shippingData || [])

    const { data: gradingData } = await supabase.from('grading_submissions')
      .select('*').eq('member_id', member.id).order('created_at', { ascending: false })
    setGradings(gradingData || [])

    const { data: ownedData } = await supabase.from('card_owners')
      .select('id, card_id, cards(id, name, rarity, series, image_url)')
      .eq('member_id', member.id)
    setMyCards(ownedData || [])

    await fetchShowcase(member.showcase_cards || [])
  }

  async function fetchShowcase(cardOwnerIds) {
    if (!cardOwnerIds || cardOwnerIds.length === 0) { setShowcaseCards([]); return }
    const { data } = await supabase.from('card_owners')
      .select('id, card_id, cards(id, name, rarity, series, image_url)')
      .in('id', cardOwnerIds)
    const ordered = cardOwnerIds.map(coid => data?.find(d => d.id === coid) || null)
    setShowcaseCards(ordered)
  }

  async function handleSelectShowcase(slotIndex, cardOwnerId) {
    const current = [...(member.showcase_cards || [])]
    while (current.length < 3) current.push(null)
    current[slotIndex] = cardOwnerId
    const cleaned = current.map(v => v || null)
    await supabase.from('members').update({ showcase_cards: cleaned.filter(Boolean) }).eq('id', member.id)
    const updated = { ...member, showcase_cards: cleaned.filter(Boolean) }
    setMember(updated)
    await fetchShowcase(cleaned.filter(Boolean))
    playSound('button_tap')
    vibrate(VIBRATE.light)
    setShowCardPicker(null)
  }

  async function handleRemoveShowcase(slotIndex) {
    const current = [...(member.showcase_cards || [])]
    while (current.length < 3) current.push(null)
    current[slotIndex] = null
    const cleaned = current.filter(Boolean)
    await supabase.from('members').update({ showcase_cards: cleaned }).eq('id', member.id)
    const updated = { ...member, showcase_cards: cleaned }
    setMember(updated)
    await fetchShowcase(cleaned)
  }

  async function handleSaveName() {
    if (!editName.trim()) return
    setSaving(true)
    await supabase.from('members').update({ display_name: editName.trim() }).eq('id', member.id)
    setMember({ ...member, display_name: editName.trim() })
    setSaving(false)
    playSound('shop_redeem_success')
    vibrate(VIBRATE.success)
    setShowSettings(false)
  }

  function compressImage(file) {
    return new Promise((resolve) => {
      const MAX = 1200
      const QUALITY = 0.82
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
          const w = Math.round(img.width * ratio)
          const h = Math.round(img.height * ratio)
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          canvas.toBlob((blob) => {
            resolve(new File([blob], 'avatar.webp', { type: 'image/webp' }))
          }, 'image/webp', QUALITY)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  async function handleAvatarUpload(e) {
    const raw = e.target.files[0]
    if (!raw) return
    setUploadingAvatar(true)
    try {
      const file = await compressImage(raw)
      const path = `avatars/${Date.now()}.webp`
      const { error: uploadErr } = await supabase.storage
        .from('card-images')
        .upload(path, file, { upsert: false, contentType: 'image/webp' })
      if (uploadErr) throw uploadErr
      const { data } = supabase.storage.from('card-images').getPublicUrl(path)
      const newUrl = data.publicUrl
      await supabase.from('members').update({ avatar_url: newUrl }).eq('id', member.id)
      setMember({ ...member, avatar_url: newUrl })
      playSound('shop_redeem_success')
      vibrate(VIBRATE.success)
    } catch (err) {
      playSound('error_system')
      vibrate(VIBRATE.error)
      toast.error('頭貼上傳失敗：' + err.message)
    }
    setUploadingAvatar(false)
    if (avatarFileRef.current) avatarFileRef.current.value = ''
  }

  async function handleRestoreLineAvatar() {
    if (!member.line_avatar_url) return
    setRestoringAvatar(true)
    try {
      await supabase.from('members').update({ avatar_url: member.line_avatar_url }).eq('id', member.id)
      setMember({ ...member, avatar_url: member.line_avatar_url })
      playSound('shop_redeem_success')
      vibrate(VIBRATE.success)
    } catch (err) {
      playSound('error_system')
      vibrate(VIBRATE.error)
      toast.error('恢復失敗：' + err.message)
    }
    setRestoringAvatar(false)
  }

  function switchTab(tab) {
    if (profileTab !== tab) { playSound('tab_switch'); vibrate(VIBRATE.light) }
    setProfileTab(tab)
  }

  function openSettings() {
    playSound('modal_open')
    vibrate(VIBRATE.light)
    setEditName(member.display_name || '')
    setShowSettings(true)
  }

  function closeSettings() {
    playSound('modal_close')
    setShowSettings(false)
  }

  if (!member) return null

  const canChangeAvatar = AVATAR_ALLOWED_LEVELS.includes(member.level)
  const theme = levelTheme(member.level)

  const nextLevel = getNextLevel(member.points)
  const currentLevelMin = LEVELS.slice().reverse().find(l => member.points >= l.min)?.min || 0
  const levelProgress = nextLevel ? Math.round((member.points - currentLevelMin) / (nextLevel.min - currentLevelMin) * 100) : 100
  const today = new Date().toISOString().split('T')[0]
  const daysUntilFullStreak = 7 - (member.login_streak % 7)

  const logIcons = { login: 'fa-calendar-day', streak_bonus: 'fa-fire', purchase: 'fa-bag-shopping', manual: 'fa-pen', makeup: 'fa-rotate-left', level_up: 'fa-arrow-up' }
  const logColors = { login: '#EAF3DE', streak_bonus: '#FAEEDA', purchase: '#FAEEDA', manual: '#E6F1FB', makeup: '#f5f0e8', level_up: '#E6F1FB' }
  const STATUS_LABEL = { pending: '待出貨', completed: '已完成', cancelled: '已取消' }
  const STATUS_STYLE = {
    pending:   { bg: '#FAEEDA', color: '#8B4A00', border: '#FAC775' },
    completed: { bg: '#EAF3DE', color: '#173404', border: '#86C566' },
    cancelled: { bg: '#f5f5f5', color: '#999',    border: '#ddd' },
  }

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#FFFBF2', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    card: { border: 'none', borderRadius: 18, padding: 14, background: '#fff', boxShadow: '0 4px 16px rgba(186,117,23,.09)', marginBottom: 14 },
    secTitle: { fontSize: 14, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 6 },
    lstat: { background: '#FFFBF2', borderRadius: 12, padding: 10, textAlign: 'center', border: '2px solid #FAE0A0' },
    typeBadge: (bg) => ({ width: 26, height: 26, borderRadius: 10, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 10 }),
    tabBtn: (active) => ({ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#E07B00' : '#bbb', textAlign: 'center', cursor: 'pointer', background: 'none', border: 'none', borderBottom: active ? '2px solid #E07B00' : '2px solid transparent' }),
  }

  const showcaseSlots = [0, 1, 2].map(i => showcaseCards[i] || null)
  const showcaseIds = (member.showcase_cards || [])

  return (
    <div style={S.page}>
      <style>{`
        @keyframes memberCardGlow{0%,100%{box-shadow:0 6px 22px rgba(0,0,0,0.10)}50%{box-shadow:0 8px 30px var(--mc-glow)}}
        @keyframes memberCardIn{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes cardGlowSolidStrong{0%,100%{box-shadow:0 0 0 1px var(--cg-ring),0 0 10px 1px var(--cg-color),0 4px 14px rgba(0,0,0,0.14)}50%{box-shadow:0 0 0 1px var(--cg-ring),0 0 20px 5px var(--cg-color),0 4px 16px rgba(0,0,0,0.16)}}
        @keyframes cardGlowSolidSoft{0%,100%{box-shadow:0 0 0 1px var(--cg-ring),0 0 6px 0px var(--cg-color),0 4px 12px rgba(0,0,0,0.10)}50%{box-shadow:0 0 0 1px var(--cg-ring),0 0 12px 2px var(--cg-color),0 4px 14px rgba(0,0,0,0.12)}}
        @keyframes cardGlowRainbow{0%{box-shadow:0 0 14px 3px rgba(255,94,108,0.65),0 4px 14px rgba(0,0,0,0.15)}25%{box-shadow:0 0 14px 3px rgba(255,206,86,0.65),0 4px 14px rgba(0,0,0,0.15)}50%{box-shadow:0 0 14px 3px rgba(120,200,80,0.65),0 4px 14px rgba(0,0,0,0.15)}75%{box-shadow:0 0 14px 3px rgba(110,155,255,0.65),0 4px 14px rgba(0,0,0,0.15)}100%{box-shadow:0 0 14px 3px rgba(255,94,108,0.65),0 4px 14px rgba(0,0,0,0.15)}}
      `}</style>
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)', padding: '18px 20px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.07) 0%,transparent 70%)' }} />
          <svg style={{ position: 'absolute', right: -16, bottom: -22, width: 100, height: 100, opacity: 0.07, pointerEvents: 'none' }} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="47" stroke="#BA7517" strokeWidth="4"/>
            <path d="M3 50 Q27 37 50 50 Q73 63 97 50" stroke="#BA7517" strokeWidth="4" fill="none"/>
            <circle cx="50" cy="50" r="12" fill="none" stroke="#BA7517" strokeWidth="4"/>
            <circle cx="50" cy="50" r="6" fill="#BA7517"/>
          </svg>
          {[[10,20],[25,62],[8,42]].map(([t,l],i) => (
            <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width:2, height:2, borderRadius:'50%', background:'#BA7517', opacity:0.4+i*0.1 }} />
          ))}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            {member.avatar_url
              ? <img src={member.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#633806', border: '1.5px solid #FAC775' }}>
                  {member.display_name?.[0]?.toUpperCase()}
                </div>
            }
            <span style={{ fontSize: 6, color: '#E07B00', fontWeight: 600 }}>{member?.level}</span>
            <button onClick={openSettings} className="press-fx"
              style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '0.5px solid #FAC775', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: 2 }}>
              <i className="fa-solid fa-gear" style={{ fontSize: 12, color: '#E07B00' }}></i>
            </button>
          </div>
          <div style={{ fontSize: 9, color: '#E07B00', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <i className="fa-solid fa-user" style={{ fontSize: 13, color: '#E07B00' }}></i>
            {member.display_name} 的主頁
          </div>
          <div style={{ fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
            <PokeballIcon level={member.level} size={12} />
            {member.level}會員 · #{String(member.member_no || '0').padStart(4, '0')}
          </div>
        </div>

        {/* Tab 切換 */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid #f0e8d0', background: '#FFFBF2' }}>
          <button style={S.tabBtn(profileTab === 'home')} onClick={() => switchTab('home')}>
            <i className="fa-solid fa-house" style={{ marginRight: 5, fontSize: 12 }}></i>主頁
          </button>
          <button style={S.tabBtn(profileTab === 'mine')} onClick={() => switchTab('mine')}>
            <i className="fa-solid fa-chart-bar" style={{ marginRight: 5, fontSize: 12 }}></i>我的
          </button>
        </div>

        {/* ── 主頁 Tab ── */}
        {profileTab === 'home' && (
          <div style={{ padding: '18px 20px 28px' }}>

            {/* ── 公開頁面提示列 ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: 10, marginBottom: 14 }}>
              <i className="fa-solid fa-earth-asia" style={{ fontSize: 12, color: '#3B82F6', flexShrink: 0 }}></i>
              <span style={{ fontSize: 11, color: '#1D4ED8', lineHeight: 1.5, flex: 1 }}>
                主頁為<strong style={{ fontWeight: 700 }}>公開頁面</strong>，展示卡、等級進度等資訊，其他人皆可查看。
              </span>
            </div>

            {/* 等級會員卡（依等級主題） */}
            <div style={{ '--mc-glow': theme.glow, position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '16px 18px', background: theme.bg, border: `1.5px solid ${theme.border}`, marginBottom: 16, animation: 'memberCardIn 0.4s ease both, memberCardGlow 3.2s ease-in-out infinite' }}>
              {/* 角落裝飾光暈 */}
              <div style={{ position: 'absolute', top: -50, right: -40, width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow} 0%, transparent 68%)`, pointerEvents: 'none' }} />
              {/* 背景大徽章浮水印 */}
              <div style={{ position: 'absolute', right: -10, bottom: -18, opacity: theme.dark ? 0.16 : 0.10, transform: 'rotate(-8deg)', pointerEvents: 'none' }}>
                <PokeballIcon level={member.level} size={92} />
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* 頭像 + 徽章光環 */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${theme.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.dark ? 'rgba(255,255,255,0.06)' : '#FAEEDA', boxShadow: `0 0 0 4px ${theme.glow}` }}>
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 22, fontWeight: 700, color: theme.dark ? theme.name : '#633806' }}>{member.display_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  {/* 等級球小徽章 */}
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: theme.dark ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
                    <PokeballIcon level={member.level} size={20} />
                  </div>
                </div>

                {/* 名稱 + 等級 + 編號 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: theme.name, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.display_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: theme.accent, background: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)', border: `0.5px solid ${theme.accent}55`, borderRadius: 99, padding: '2px 9px 2px 6px' }}>
                      <PokeballIcon level={member.level} size={14} />
                      {member.level}
                    </span>
                    <span style={{ fontSize: 11, color: theme.sub }}>#{String(member.member_no || '0').padStart(4, '0')}</span>
                  </div>
                  <div style={{ fontSize: 10, color: theme.sub, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="fa-regular fa-clock" style={{ fontSize: 9 }}></i>
                    加入於 {new Date(member.created_at).toLocaleDateString('zh-TW')}
                  </div>
                </div>

                {/* 積分 */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: theme.accent, letterSpacing: '-0.5px', lineHeight: 1.1 }}><CountUp value={member.points || 0} separator /></div>
                  <div style={{ fontSize: 10, color: theme.sub, marginTop: 2 }}>積分</div>
                </div>
              </div>
            </div>

            {/* 展示卡 */}
            <div style={{ ...S.secTitle, marginBottom: 12 }}>
              <span style={S.typeBadge('linear-gradient(135deg,#BA7517,#EF9F27)')}><i className="fa-solid fa-id-card"></i></span>
              展示卡
              <span style={{ fontSize: 11, color: '#bbb', fontWeight: 400, marginLeft: 4 }}>最多 3 張</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {showcaseSlots.map((slot, i) => {
                const rc = slot?.cards ? (RARITY_COLORS[slot.cards.rarity] || RARITY_COLORS.Other) : null
                const glow = slot?.cards ? rarityGlow(slot.cards.rarity) : null
                const isStrongGlow = slot?.cards ? ['UR', 'SAR', 'CSR'].includes(slot.cards.rarity) : false
                const glowAnim = glow
                  ? (glow.kind === 'rainbow'
                      ? 'cardGlowRainbow 4s linear infinite'
                      : `${isStrongGlow ? 'cardGlowSolidStrong' : 'cardGlowSolidSoft'} 2.6s ease-in-out infinite`)
                  : undefined
                const glowVars = glow && glow.kind !== 'rainbow' ? { '--cg-color': glow.color, '--cg-ring': glow.ring } : {}
                return (
                  <div key={i} style={{ position: 'relative' }}>
                    <div
                      onClick={() => { playSound('modal_open'); vibrate(VIBRATE.light); setShowCardPicker(i) }}
                      className="press-fx-soft"
                      style={{ ...glowVars, aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', background: slot ? '#fff' : '#f5f0e8', border: slot ? 'none' : '2px dashed #F5E8C8', boxShadow: slot && !glowAnim ? '0 4px 14px rgba(186,117,23,.12)' : 'none', animation: glowAnim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', position: 'relative' }}>
                      {slot?.cards?.image_url
                        ? <img src={slot.cards.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : slot
                          ? <i className="fa-solid fa-id-card" style={{ fontSize: 28, color: '#D4A94A', opacity: 0.4 }}></i>
                          : <>
                              <i className="fa-solid fa-plus" style={{ fontSize: 16, color: '#D4A94A', opacity: 0.5, marginBottom: 4 }}></i>
                              <span style={{ fontSize: 9, color: '#D4A94A', opacity: 0.6 }}>選擇卡片</span>
                            </>
                      }
                      {slot?.cards && (
                        <span style={{ position: 'absolute', top: 5, left: 5, fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 20, background: rc.bg, color: rc.color }}>{slot.cards.rarity}</span>
                      )}
                    </div>
                    {slot && (
                      <button
                        onClick={e => { e.stopPropagation(); handleRemoveShowcase(i) }}
                        style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                        ✕
                      </button>
                    )}
                    {slot?.cards && (
                      <div style={{ marginTop: 5, fontSize: 9, color: '#7a5c2e', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {slot.cards.name}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 等級進度（簡版） */}
            <div style={{ ...S.secTitle, marginBottom: 12 }}>
              <span style={S.typeBadge('linear-gradient(135deg,#378ADD,#185FA5)')}><i className="fa-solid fa-medal"></i></span>
              等級進度
            </div>
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LevelBadge level={member.level} size='md' />
                  <span style={{ fontSize: 13, color: '#ccc' }}>→</span>
                  {nextLevel && <LevelBadge level={nextLevel.name} size='md' />}
                </div>
                {nextLevel && <span style={{ fontSize: 11, color: '#999' }}>還差 {(nextLevel.min - member.points).toLocaleString()} 點</span>}
              </div>
              <div style={{ height: 8, background: '#f0e8d0', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
                <div style={{ height: '100%', width: `${levelProgress}%`, background: 'linear-gradient(90deg,#378ADD,#BA7517)', borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb' }}>
                <span>{member.points?.toLocaleString()} 點</span>
                {nextLevel ? <span>{levelProgress}%</span> : <span style={{ color: '#BA7517', fontWeight: 700 }}><i className="fa-solid fa-crown" style={{ fontSize: 9, marginRight: 3 }}></i>已達頂級</span>}
              </div>
            </div>

            {/* 福利入口 */}
            <div onClick={() => { playSound('modal_open'); vibrate(VIBRATE.light); setShowBenefits(true) }} className="press-fx-soft" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', border: '0.5px solid #f0e8d0', borderRadius: 12, background: 'linear-gradient(135deg,#fdfaf4,#fff)', boxShadow: '0 1px 6px rgba(186,117,23,0.05)', cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '0.5px solid rgba(186,117,23,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-gift" style={{ fontSize: 16, color: '#E07B00' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 2 }}>會員等級福利</div>
                <div style={{ fontSize: 11, color: '#bbb' }}>查看各等級專屬優惠 →</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: '#ccc' }}></i>
            </div>
          </div>
        )}

        {/* ── 我的 Tab ── */}
        {profileTab === 'mine' && (
          <div style={{ padding: '18px 20px 0' }}>

            {/* 數據 */}
            <div style={{ ...S.secTitle, marginBottom: 12 }}>
              <span style={S.typeBadge('linear-gradient(135deg,#378ADD,#185FA5)')}><i className="fa-solid fa-chart-bar"></i></span>
              我的數據
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { num: member.points?.toLocaleString(), label: '累積積分' },
                { num: `$${(member.total_spent||0).toLocaleString()}`, label: '累積消費' },
                { num: member.login_streak, label: '連續登入天數' },
                { num: member.total_logins, label: '總登入天數' },
              ].map((s, i) => (
                <div key={i} style={S.lstat}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 本週簽到 */}
            <div style={{ ...S.secTitle, marginBottom: 12 }}>
              <span style={S.typeBadge('linear-gradient(135deg,#378ADD,#185FA5)')}><i className="fa-solid fa-calendar-check"></i></span>
              本週簽到
              <span style={{ marginLeft: 'auto', fontSize: 11, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', color: '#8B4A00', padding: '3px 8px', borderRadius: 20, border: '0.5px solid #FAC775', fontWeight: 500 }}>
                連續 {member.login_streak} 天
              </span>
            </div>
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {weekLogins.map((d) => {
                  const isToday = d.date === today
                  const tc = d.typeConfig
                  return (
                    <div key={d.date} style={{
                      aspectRatio: 1, borderRadius: 9,
                      background: d.done ? (isToday ? '#FCEBEB' : 'linear-gradient(135deg,#FAEEDA,#FFF3D0)') : d.isFuture ? '#f5f5f5' : isToday ? '#fff5f5' : '#f8f5f0',
                      border: `1px solid ${d.done ? (isToday ? '#F09595' : '#FAC775') : d.isFuture ? '#eee' : '#eee'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: d.done ? tc.color : d.isFuture ? '#ddd' : '#e0dbd4', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: d.done ? 1 : d.isFuture ? 0.3 : 0.4 }}>
                        <img src={`${CDN}/${tc.type}.svg`} alt={tc.name} style={{ width: 12, height: 12 }} />
                      </div>
                      <span style={{ fontSize: 8, fontWeight: 700, color: d.done ? (isToday ? '#7A1A1A' : '#7A4A00') : '#bbb' }}>{tc.label}</span>
                    </div>
                  )
                })}
              </div>
              {daysUntilFullStreak <= 3 && daysUntilFullStreak > 0 && (
                <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="fa-solid fa-gift" style={{ color: '#E07B00' }}></i>
                  再 {daysUntilFullStreak} 天全勤可獲得 +15 積分
                </div>
              )}
            </div>

            {/* 出貨記錄 */}
            <div style={{ ...S.secTitle, justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={S.typeBadge('linear-gradient(135deg,#BA7517,#D4A94A)')}><i className="fa-solid fa-truck"></i></span>
                出貨記錄
              </div>
              {shippingOrders.length > 3 && (
                <span onClick={() => { playSound('modal_open'); vibrate(VIBRATE.light); setShowShipping(true) }} style={{ fontSize: 11, color: '#E07B00', cursor: 'pointer', fontWeight: 400 }}>全部 →</span>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              {shippingOrders.length === 0 ? (
                <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '16px 0' }}>尚無出貨記錄</div>
              ) : shippingOrders.slice(0, 3).map(order => {
                const ss = STATUS_STYLE[order.status] || STATUS_STYLE.cancelled
                return (
                  <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: ss.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `0.5px solid ${ss.border}` }}>
                      <i className="fa-solid fa-truck" style={{ fontSize: 13, color: ss.color }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.store_name}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{order.recipient_name} · {order.phone}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, background: ss.bg, color: ss.color, padding: '2px 8px', borderRadius: 20, border: `0.5px solid ${ss.border}` }}>
                        {STATUS_LABEL[order.status]}
                      </span>
                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 3 }}>{new Date(order.created_at).toLocaleDateString('zh-TW')}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 已送鑑定 */}
            <div style={{ ...S.secTitle, justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={S.typeBadge('linear-gradient(135deg,#7038F8,#9B6BFF)')}><i className="fa-solid fa-star"></i></span>
                已送鑑定
              </div>
              {gradings.length > 3 && (
                <span onClick={() => { playSound('modal_open'); vibrate(VIBRATE.light); setShowGrading(true) }} style={{ fontSize: 11, color: '#E07B00', cursor: 'pointer', fontWeight: 400 }}>全部 →</span>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              {gradings.length === 0 ? (
                <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '16px 0' }}>尚無鑑定紀錄</div>
              ) : gradings.slice(0, 3).map(g => {
                const gs = GRADING_STATUS[g.status] || GRADING_STATUS.submitted
                return (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                    <div style={{ width: 44, height: 58, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1.5px solid #F5E8C8' }}>
                      {g.image_url
                        ? <img src={g.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: gs.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-star" style={{ fontSize: 16, color: gs.color }}></i>
                          </div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.card_name}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>
                        {g.grading_company || '—'}{g.card_set ? ` · ${g.card_set}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, background: gs.bg, color: gs.color, padding: '2px 8px', borderRadius: 20 }}>{gs.label}</span>
                      {g.grade != null
                        ? <div style={{ fontSize: 11, fontWeight: 700, color: '#2D1A00', marginTop: 3 }}>{g.grade} 分</div>
                        : <div style={{ fontSize: 10, color: '#bbb', marginTop: 3 }}>{g.submitted_at || '—'}</div>
                      }
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 積分紀錄 */}
            <div style={{ ...S.secTitle, marginBottom: 12 }}>
              <span style={S.typeBadge('linear-gradient(135deg,#639922,#3B6D11)')}><i className="fa-solid fa-clock-rotate-left"></i></span>
              積分紀錄
            </div>
            <div style={{ marginBottom: 28 }}>
              {logs.length === 0 && <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', padding: '16px 0' }}>尚無紀錄</div>}
              {logs.map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: logColors[log.type] || '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fa-solid ${logIcons[log.type] || 'fa-pen'}`} style={{ fontSize: 14, color: '#666' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{log.note || log.type}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{new Date(log.created_at).toLocaleDateString('zh-TW')}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: log.points > 0 ? '#BA7517' : '#A32D2D' }}>
                    {log.points > 0 ? '+' : ''}{log.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 卡片選擇器 Sheet */}
      {showCardPicker !== null && (
        <div onClick={() => { playSound('modal_close'); setShowCardPicker(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '75vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2D1A00' }}>選擇展示卡 · 第 {showCardPicker + 1} 格</div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>從你持有的卡片中選擇</div>
            </div>
            <div style={{ overflowY: 'auto', padding: '10px 16px 32px' }}>
              {myCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#bbb', fontSize: 13 }}>尚無持有卡片</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {myCards.map(co => {
                    const rc = RARITY_COLORS[co.cards?.rarity] || RARITY_COLORS.Other
                    const isSelected = showcaseIds.includes(co.id)
                    return (
                      <div key={co.id}
                        onClick={() => !isSelected && handleSelectShowcase(showCardPicker, co.id)}
                        className={isSelected ? '' : 'press-fx-soft'}
                        style={{ opacity: isSelected ? 0.4 : 1, cursor: isSelected ? 'not-allowed' : 'pointer' }}>
                        <div style={{ aspectRatio: '3/4', borderRadius: 12, overflow: 'hidden', background: '#f8f5f0', border: `1.5px solid ${isSelected ? '#F5E8C8' : rc.color + '44'}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {co.cards?.image_url
                            ? <img src={co.cards.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <i className="fa-solid fa-id-card" style={{ fontSize: 24, color: '#D4A94A', opacity: 0.4 }}></i>
                          }
                          <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 7, fontWeight: 700, padding: '1px 5px', borderRadius: 20, background: rc.bg, color: rc.color }}>{co.cards?.rarity}</span>
                          {isSelected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa-solid fa-check" style={{ fontSize: 20, color: '#E07B00' }}></i>
                          </div>}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 9, color: '#7a5c2e', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {co.cards?.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 出貨記錄全覽 Sheet */}
      {showShipping && (
        <div onClick={() => { playSound('modal_close'); setShowShipping(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '80vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
                <i className="fa-solid fa-truck" style={{ color: '#E07B00', marginRight: 6 }}></i>全部出貨記錄
              </div>
              <span style={{ fontSize: 11, color: '#bbb' }}>{shippingOrders.length} 筆</span>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 32px' }}>
              {shippingOrders.map(order => {
                const ss = STATUS_STYLE[order.status] || STATUS_STYLE.cancelled
                return (
                  <div key={order.id} style={{ padding: '12px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{order.store_name}</div>
                      <span style={{ fontSize: 10, fontWeight: 600, background: ss.bg, color: ss.color, padding: '2px 8px', borderRadius: 20, border: `0.5px solid ${ss.border}` }}>{STATUS_LABEL[order.status]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>
                      <i className="fa-solid fa-user" style={{ fontSize: 10, marginRight: 4, color: '#bbb' }}></i>
                      {order.recipient_name} · {order.phone}
                    </div>
                    {order.note && (
                      <div style={{ fontSize: 11, color: '#999', marginBottom: 3 }}>
                        <i className="fa-solid fa-note-sticky" style={{ fontSize: 10, marginRight: 4, color: '#bbb' }}></i>{order.note}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#bbb' }}>
                      <i className="fa-solid fa-clock" style={{ fontSize: 9, marginRight: 4 }}></i>
                      {new Date(order.created_at).toLocaleDateString('zh-TW')}
                      {order.status === 'cancelled' && order.cancelled_at && (
                        <span style={{ marginLeft: 8, color: '#E24B4A' }}>· 取消於 {new Date(order.cancelled_at).toLocaleDateString('zh-TW')}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 鑑定紀錄全覽 Sheet */}
      {showGrading && (
        <div onClick={() => { playSound('modal_close'); setShowGrading(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '80vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
                <i className="fa-solid fa-star" style={{ color: '#7038F8', marginRight: 6 }}></i>全部鑑定紀錄
              </div>
              <span style={{ fontSize: 11, color: '#bbb' }}>{gradings.length} 筆</span>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 32px' }}>
              {gradings.map(g => {
                const gs = GRADING_STATUS[g.status] || GRADING_STATUS.submitted
                return (
                  <div key={g.id} style={{ padding: '12px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                    {g.image_url && (
                      <img src={g.image_url} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 10, border: '1.5px solid #F5E8C8' }} />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{g.card_name}</div>
                      <span style={{ fontSize: 10, fontWeight: 600, background: gs.bg, color: gs.color, padding: '2px 8px', borderRadius: 20 }}>{gs.label}</span>
                    </div>
                    {g.card_set && <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}><i className="fa-solid fa-layer-group" style={{ fontSize: 10, marginRight: 4, color: '#bbb' }}></i>{g.card_set}</div>}
                    {g.grading_company && <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}><i className="fa-solid fa-building" style={{ fontSize: 10, marginRight: 4, color: '#bbb' }}></i>{g.grading_company}</div>}
                    {g.grade != null && <div style={{ fontSize: 12, color: '#2D1A00', fontWeight: 700, marginBottom: 3 }}><i className="fa-solid fa-star" style={{ fontSize: 10, marginRight: 4, color: '#7038F8' }}></i>鑑定分數：{g.grade}</div>}
                    {g.notes && <div style={{ fontSize: 11, color: '#999', marginBottom: 3 }}><i className="fa-solid fa-note-sticky" style={{ fontSize: 10, marginRight: 4, color: '#bbb' }}></i>{g.notes}</div>}
                    <div style={{ fontSize: 10, color: '#bbb' }}><i className="fa-solid fa-clock" style={{ fontSize: 9, marginRight: 4 }}></i>送件：{g.submitted_at || '—'}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 設定彈窗 */}
      {showSettings && (
        <div onClick={closeSettings} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: 20 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>設定</div>
            <div style={{ fontSize: 12, color: '#bbb', marginBottom: 18 }}>#{String(member.member_no || '0').padStart(4, '0')}</div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 10 }}>頭貼</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid #FAC775', flexShrink: 0, background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {member.avatar_url
                    ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24, fontWeight: 700, color: '#633806' }}>{member.display_name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                {canChangeAvatar ? (
                  <div style={{ flex: 1 }}>
                    <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    <button onClick={() => !uploadingAvatar && avatarFileRef.current?.click()} disabled={uploadingAvatar} className="press-fx"
                      style={{ width: '100%', padding: '9px 12px', background: uploadingAvatar ? '#f0ebe3' : 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '0.5px solid #FAC775', borderRadius: 10, fontSize: 13, fontWeight: 500, color: uploadingAvatar ? '#ccc' : '#8B5A00', cursor: uploadingAvatar ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 6 }}>
                      {uploadingAvatar ? <><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 12 }}></i>上傳中...</> : <><i className="fa-solid fa-camera" style={{ fontSize: 12 }}></i>更換頭貼</>}
                    </button>
                    {member.line_avatar_url && member.avatar_url !== member.line_avatar_url && (
                      <button onClick={handleRestoreLineAvatar} disabled={restoringAvatar} className="press-fx"
                        style={{ width: '100%', padding: '8px 12px', background: restoringAvatar ? '#f0ebe3' : '#fff', border: '0.5px solid #f0e8d0', borderRadius: 10, fontSize: 12, fontWeight: 500, color: restoringAvatar ? '#ccc' : '#888', cursor: restoringAvatar ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
                        {restoringAvatar ? <><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11 }}></i>恢復中...</> : <><i className="fa-brands fa-line" style={{ fontSize: 12, color: '#06C755' }}></i>恢復 LINE 頭貼</>}
                      </button>
                    )}
                    <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center' }}>支援 JPG、PNG、WebP</div>
                  </div>
                ) : (
                  <div style={{ flex: 1, padding: '10px 12px', background: '#f8f5f0', border: '0.5px solid #f0e8d0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-lock" style={{ fontSize: 14, color: '#CBD5E1', flexShrink: 0 }}></i>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 2 }}>功能鎖定中</div>
                      <div style={{ fontSize: 10, color: '#bbb', lineHeight: 1.4 }}>升至高級球及以上<br/>即可自訂頭貼</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ height: '0.5px', background: '#f0e8d0', marginBottom: 16 }} />

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 6 }}>暱稱</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="輸入你的暱稱"
                style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #f0e8d0', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', background: '#fdfaf4', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleSaveName} disabled={saving || !editName.trim() || editName.trim() === member.display_name} className="press-fx"
              style={{ width: '100%', padding: 12, background: (saving || !editName.trim() || editName.trim() === member.display_name) ? '#f0ebe3' : 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '0.5px solid #FAC775', borderRadius: 10, fontSize: 14, fontWeight: 500, color: (saving || !editName.trim() || editName.trim() === member.display_name) ? '#ccc' : '#8B5A00', cursor: 'pointer', marginBottom: 10 }}>
              {saving ? '儲存中...' : '儲存暱稱'}
            </button>

            <div style={{ height: '0.5px', background: '#f0e8d0', margin: '6px 0 14px' }} />

            {/* 音效開關 */}
            <div style={{ marginBottom: 14 }}>
              <SoundToggle />
            </div>

            <button onClick={signOut} className="press-fx" style={{ width: '100%', padding: 12, background: '#fff', border: '0.5px solid #F09595', borderRadius: 10, fontSize: 14, color: '#A32D2D', cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 13 }}></i>登出
            </button>
            <button onClick={closeSettings} className="press-fx" style={{ width: '100%', padding: 12, background: '#f8f5f0', border: 'none', borderRadius: 10, fontSize: 14, color: '#888', cursor: 'pointer' }}>取消</button>
          </div>
        </div>
      )}

      {/* 積分升級表 Sheet */}
      {showBenefits && (
        <div onClick={() => { playSound('modal_close'); setShowBenefits(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '85vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="fa-solid fa-trophy" style={{ fontSize: 14, color: '#E07B00' }}></i>
                會員等級積分表
              </div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>累積積分即可自動升級</div>
            </div>
            <div style={{ overflowY: 'auto', padding: '12px 20px 32px' }}>
              {LEVELS.map((lv, i) => {
                const next = LEVELS[i + 1]
                const isCurrentLevel = member.level === lv.name
                const isAchieved = member.points >= lv.min
                return (
                  <div key={lv.name} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px', borderRadius: 14, marginBottom: 8,
                    background: isCurrentLevel ? 'linear-gradient(135deg,#FFF8EE,#FFFBF2)' : '#fdfaf4',
                    border: isCurrentLevel ? '1.5px solid #FAC775' : '0.5px solid #f0e8d0',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {isCurrentLevel && (
                      <div style={{ position: 'absolute', top: 6, right: 10, fontSize: 9, fontWeight: 700, background: '#E07B00', color: '#fff', padding: '2px 7px', borderRadius: 99 }}>目前等級</div>
                    )}
                    <div style={{ flexShrink: 0 }}><PokeballIcon level={lv.name} size={36} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: isAchieved ? '#2D1A00' : '#bbb' }}>{lv.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: isAchieved ? '#BA7517' : '#ccc', fontWeight: 600 }}>
                        {lv.min === 0 ? '初始等級' : `累積 ${lv.min.toLocaleString()} 積分`}
                      </div>
                      {next && (
                        <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>
                          → 下一級 {next.name}：{next.min.toLocaleString()} 積分
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {isAchieved
                        ? <i className="fa-solid fa-circle-check" style={{ fontSize: 18, color: '#78C850' }}></i>
                        : <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#bbb' }}>還差</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#D4A94A' }}>{(lv.min - member.points).toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: '#bbb' }}>積分</div>
                          </div>
                      }
                    </div>
                  </div>
                )
              })}
              <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <i className="fa-solid fa-circle-info" style={{ fontSize: 10 }}></i>
                每消費 $1 可獲得 1 積分
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
