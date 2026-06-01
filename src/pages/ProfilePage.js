import React, { useEffect, useState } from 'react'
import { supabase, LEVELS, getNextLevel } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'
import BenefitsPage from '../components/BenefitsPage'

const CDN = 'https://cdn.jsdelivr.net/gh/duiker101/pokemon-type-svg-icons@master/icons'
const TYPE_BY_WEEKDAY = {
  1: { type: 'water', color: '#6890F0', name: '水', label: '一' },
  2: { type: 'fire', color: '#F08030', name: '火', label: '二' },
  3: { type: 'grass', color: '#78C850', name: '草', label: '三' },
  4: { type: 'electric', color: '#F8D030', name: '電', label: '四' },
  5: { type: 'psychic', color: '#F85888', name: '超能', label: '五' },
  6: { type: 'fighting', color: '#C03028', name: '鬥', label: '六' },
  0: { type: 'dragon', color: '#7038F8', name: '龍', label: '日' },
}

const GRADING_STATUS = {
  submitted: { label: '已送出', color: '#E07B00', bg: '#FFF3E0' },
  grading:   { label: '鑑定中', color: '#1976D2', bg: '#E3F2FD' },
  returned:  { label: '已取回', color: '#388E3C', bg: '#E8F5E9' },
  sold:      { label: '已售出', color: '#757575', bg: '#F5F5F5' },
}

export default function ProfilePage() {
  const { member, setMember, signOut } = useAuth()
  const [logs, setLogs] = useState([])
  const [weekLogins, setWeekLogins] = useState([])
  const [shippingOrders, setShippingOrders] = useState([])
  const [gradings, setGradings] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showBenefits, setShowBenefits] = useState(false)
  const [showShipping, setShowShipping] = useState(false)
  const [showGrading, setShowGrading] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

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
  }

  async function handleSaveName() {
    if (!editName.trim()) return
    setSaving(true)
    await supabase.from('members').update({ display_name: editName.trim() }).eq('id', member.id)
    setMember({ ...member, display_name: editName.trim() })
    setSaving(false)
    setShowSettings(false)
  }

  if (!member) return null

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
  }

  return (
    <div style={S.page}>
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
            <button onClick={() => { setEditName(member.display_name || ''); setShowSettings(true) }}
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

        <div style={{ padding: '18px 20px 0' }}>

          {/* 等級進度 */}
          <div style={{ ...S.secTitle, marginBottom: 12 }}>
            <span style={S.typeBadge('linear-gradient(135deg,#BA7517,#EF9F27)')}><i className="fa-solid fa-medal"></i></span>
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
              <span>{member.points?.toLocaleString()} 點</span><span>{levelProgress}%</span>
            </div>
          </div>

          {/* 等級路線 */}
          <div style={{ borderRadius: 12, marginBottom: 16, border: '0.5px solid #f0e8d0', boxShadow: '0 1px 6px rgba(186,117,23,0.05)', overflow: 'hidden' }}>
            {LEVELS.map((l, i) => {
              const isDone = member.points >= l.min
              const isCurrent = member.level === l.name
              const isFirst = i === 0
              const isLast = i === LEVELS.length - 1
              return (
                <div key={l.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderBottom: isLast ? 'none' : '0.5px solid #f5f0e8',
                  background: isCurrent ? 'linear-gradient(135deg,#FFF5DC,#FFFBF2)' : '#fff',
                  opacity: isDone || isCurrent ? 1 : 0.35,
                  borderRadius: isFirst ? '12px 12px 0 0' : isLast ? '0 0 12px 12px' : 0,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: `1px solid ${isCurrent ? '#FAC775' : '#eee'}` }}>
                    <PokeballIcon level={l.name} size={20} />
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: isCurrent ? '#8B5A00' : '#111' }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: isCurrent ? '#BA7517' : '#bbb' }}>{i === 0 ? '初始會員' : `${l.min.toLocaleString()} 點`}</div>
                  {isDone && !isCurrent && <i className="fa-solid fa-check" style={{ fontSize: 11, color: '#E07B00' }}></i>}
                  {isCurrent && <span style={{ fontSize: 9, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', color: '#8B4A00', padding: '2px 7px', borderRadius: 20, border: '0.5px solid #FAC775', fontWeight: 700 }}>目前</span>}
                </div>
              )
            })}
          </div>

          {/* 福利入口 */}
          <div onClick={() => setShowBenefits(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', border: '0.5px solid #f0e8d0', borderRadius: 12, background: 'linear-gradient(135deg,#fdfaf4,#fff)', boxShadow: '0 1px 6px rgba(186,117,23,0.05)', marginBottom: 16, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '0.5px solid rgba(186,117,23,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-solid fa-gift" style={{ fontSize: 16, color: '#E07B00' }}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 2 }}>會員等級福利</div>
              <div style={{ fontSize: 11, color: '#bbb' }}>查看各等級專屬優惠 →</div>
            </div>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: '#ccc' }}></i>
          </div>

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
                再 {daysUntilFullStreak} 天全勤可獲得 +15 點
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
              <span onClick={() => setShowShipping(true)} style={{ fontSize: 11, color: '#E07B00', cursor: 'pointer', fontWeight: 400 }}>全部 →</span>
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
              <span onClick={() => setShowGrading(true)} style={{ fontSize: 11, color: '#E07B00', cursor: 'pointer', fontWeight: 400 }}>全部 →</span>
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
      </div>

      {/* 出貨記錄全覽 Sheet */}
      {showShipping && (
        <div onClick={() => setShowShipping(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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
        <div onClick={() => setShowGrading(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
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
        <div onClick={() => setShowSettings(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: 20 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>設定</div>
            <div style={{ fontSize: 12, color: '#bbb', marginBottom: 18 }}>#{String(member.member_no || '0').padStart(4, '0')}</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 6 }}>暱稱</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="輸入你的暱稱"
                style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #f0e8d0', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', background: '#fdfaf4', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleSaveName} disabled={saving || !editName.trim() || editName.trim() === member.display_name}
              style={{ width: '100%', padding: 12, background: (saving || !editName.trim() || editName.trim() === member.display_name) ? '#f0ebe3' : 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '0.5px solid #FAC775', borderRadius: 10, fontSize: 14, fontWeight: 500, color: (saving || !editName.trim() || editName.trim() === member.display_name) ? '#ccc' : '#8B5A00', cursor: 'pointer', marginBottom: 10 }}>
              {saving ? '儲存中...' : '儲存暱稱'}
            </button>
            <div style={{ height: '0.5px', background: '#f0e8d0', margin: '6px 0 14px' }} />
            <button onClick={signOut} style={{ width: '100%', padding: 12, background: '#fff', border: '0.5px solid #F09595', borderRadius: 10, fontSize: 14, color: '#A32D2D', cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 13 }}></i>登出
            </button>
            <button onClick={() => setShowSettings(false)} style={{ width: '100%', padding: 12, background: '#f8f5f0', border: 'none', borderRadius: 10, fontSize: 14, color: '#888', cursor: 'pointer' }}>取消</button>
          </div>
        </div>
      )}

      {/* 福利頁面 Sheet */}
      {showBenefits && (
        <div onClick={() => setShowBenefits(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, height: '88vh', background: '#fff', borderRadius: '16px 16px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '10px auto 0', flexShrink: 0 }} />
            <BenefitsPage onClose={() => setShowBenefits(false)} />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
