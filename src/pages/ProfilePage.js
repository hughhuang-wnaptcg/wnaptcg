import React, { useEffect, useState } from 'react'
import { supabase, LEVELS, getNextLevel } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function ProfilePage() {
  const { member, setMember, signOut } = useAuth()
  const [logs, setLogs] = useState([])
  const [weekLogins, setWeekLogins] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (member) fetchData() }, [member])

  async function fetchData() {
    const { data: logData } = await supabase.from('point_logs')
      .select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(10)
    setLogs(logData || [])
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      days.push(d.toISOString().split('T')[0])
    }
    const { data: loginData } = await supabase.from('daily_logins')
      .select('login_date').eq('member_id', member.id).in('login_date', days)
    const loginDates = new Set((loginData || []).map(l => l.login_date))
    setWeekLogins(days.map(d => ({ date: d, done: loginDates.has(d) })))
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
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  const daysUntilFullStreak = 7 - (member.login_streak % 7)

  const logIcons = { login: 'fa-calendar-day', streak_bonus: 'fa-fire', purchase: 'fa-bag-shopping', manual: 'fa-pen', level_up: 'fa-arrow-up' }
  const logColors = { login: '#EAF3DE', streak_bonus: '#FAEEDA', purchase: '#FAEEDA', manual: '#E6F1FB', level_up: '#E6F1FB' }

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    card: { border: '0.5px solid #f0e8d0', borderRadius: 12, padding: 14, boxShadow: '0 1px 6px rgba(186,117,23,0.05)', marginBottom: 14 },
    secTitle: { fontSize: 14, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 },
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
      <TopBar right={
        <i className="fa-solid fa-gear" style={{ fontSize: 16, color: '#BA7517', opacity: 0.7, cursor: 'pointer' }}
          onClick={() => { setEditName(member.display_name || ''); setShowSettings(true) }}></i>
      } />

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg,#fff 0%,#fdfaf4 60%,#faf4e8 100%)', padding: '18px 20px 16px', position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid #f0e8d0' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.07) 0%,transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -6, left: -6, fontSize: 72, opacity: 0.05, color: '#BA7517', lineHeight: 1, pointerEvents: 'none' }}>
            <i className="fa-solid fa-user" aria-hidden="true"></i>
          </div>
          {[[10,20],[25,62],[8,42]].map(([t,l],i) => (
            <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width:2, height:2, borderRadius:'50%', background:'#BA7517', opacity:0.4+i*0.1 }} />
          ))}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {member.avatar_url
              ? <img src={member.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#633806', border: '1.5px solid #FAC775' }}>
                  {member.display_name?.[0]?.toUpperCase()}
                </div>
            }
            <span style={{ fontSize: 6, color: '#BA7517', fontWeight: 600 }}>{member?.level}</span>
          </div>
          <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <i className="fa-solid fa-user" style={{ fontSize: 13, color: '#BA7517' }} aria-hidden="true"></i>
            {member.display_name} 的主頁
          </div>
          <div style={{ fontSize: 11, color: '#bbb' }}>
            <PokeballIcon level={member.level} size={12} />
            <span style={{ marginLeft: 4 }}>{member.level}會員 · #{String(member.member_no || '0').padStart(4, '0')}</span>
          </div>
        </div>

        <div style={{ padding: '18px 20px 0' }}>

          {/* 等級進度 */}
          <div style={S.secTitle}>
            <i className="fa-solid fa-medal" style={{ fontSize: 14, color: '#BA7517' }}></i>等級進度
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
              <span>{levelProgress}%</span>
            </div>
          </div>

          {/* 等級路線 */}
          <div style={{ border: '0.5px solid #f0e8d0', borderRadius: 12, overflow: 'hidden', marginBottom: 18, boxShadow: '0 1px 6px rgba(186,117,23,0.05)' }}>
            {LEVELS.map((l, i) => {
              const isDone = member.points >= l.min
              const isCurrent = member.level === l.name
              return (
                <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < LEVELS.length - 1 ? '0.5px solid #f5f0e8' : 'none', background: isCurrent ? 'linear-gradient(135deg,#FAEEDA,#FFF8EE)' : 'transparent', opacity: isDone || isCurrent ? 1 : 0.45 }}>
                  <PokeballIcon level={l.name} size={18} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: isCurrent ? '#8B5A00' : '#111' }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: isCurrent ? '#BA7517' : '#bbb' }}>{i === 0 ? '初始會員' : `${l.min.toLocaleString()} 點`}</div>
                  {isDone && !isCurrent && <i className="fa-solid fa-check" style={{ fontSize: 12, color: '#BA7517' }}></i>}
                  {isCurrent && <span style={{ fontSize: 10, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', color: '#8B5A00', padding: '2px 7px', borderRadius: 20, border: '0.5px solid #FAC775' }}>目前</span>}
                </div>
              )
            })}
          </div>

          {/* 數據 */}
          <div style={S.secTitle}>
            <i className="fa-solid fa-chart-bar" style={{ fontSize: 14, color: '#BA7517' }}></i>我的數據
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 18 }}>
            {[{ num: member.points?.toLocaleString(), label: '累積積分' }, { num: `$${member.total_spent?.toLocaleString()}`, label: '累積消費' }, { num: member.login_streak, label: '連續登入天數' }, { num: member.total_logins, label: '總登入天數' }].map((s, i) => (
              <div key={i} style={S.lstat}>
                <div style={{ fontSize: 20, fontWeight: 500, color: '#111' }}>{s.num}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 簽到 */}
          <div style={{ ...S.card, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="fa-solid fa-calendar-check" style={{ fontSize: 13, color: '#BA7517' }}></i>本週簽到
              </div>
              <span style={{ fontSize: 11, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', color: '#8B5A00', padding: '3px 8px', borderRadius: 20, border: '0.5px solid #FAC775' }}>連續 {member.login_streak} 天</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
              {weekLogins.map((d, i) => (
                <div key={d.date} style={S.day(d.date === today, d.done)}>
                  <i className={`fa-solid ${d.done || d.date === today ? 'fa-check' : 'fa-circle'}`} style={{ fontSize: 10, opacity: d.done || d.date === today ? 1 : 0.3 }}></i>
                  <span>{dayNames[i]}</span>
                </div>
              ))}
            </div>
            {daysUntilFullStreak <= 3 && (
              <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="fa-solid fa-gift" style={{ color: '#BA7517' }}></i>
                再 {daysUntilFullStreak} 天全勤可獲得 +15 點
              </div>
            )}
          </div>

          {/* 積分紀錄 */}
          <div style={S.secTitle}>
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 14, color: '#BA7517' }}></i>積分紀錄
          </div>
          <div style={{ marginBottom: 28 }}>
            {logs.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: logColors[log.type] || '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fa-solid ${logIcons[log.type] || 'fa-pen'}`} style={{ fontSize: 14, color: '#666' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{log.note || log.type}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{new Date(log.created_at).toLocaleDateString('zh-TW')}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: log.points > 0 ? '#BA7517' : '#A32D2D' }}>
                  {log.points > 0 ? '+' : ''}{log.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 設定彈窗 */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: 20 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: '#111', marginBottom: 16 }}>設定</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 6 }}>暱稱</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="輸入你的暱稱"
                style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #f0e8d0', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none', background: '#fdfaf4' }} />
            </div>
            <button onClick={handleSaveName} disabled={saving}
              style={{ width: '100%', padding: 12, background: saving ? '#ccc' : 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '0.5px solid #FAC775', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#8B5A00', cursor: 'pointer', marginBottom: 10 }}>
              {saving ? '儲存中...' : '儲存暱稱'}
            </button>
            <button onClick={signOut}
              style={{ width: '100%', padding: 12, background: '#fff', border: '0.5px solid #f0e8d0', borderRadius: 10, fontSize: 14, color: '#999', cursor: 'pointer', marginBottom: 10 }}>
              登出
            </button>
            <button onClick={() => setShowSettings(false)}
              style={{ width: '100%', padding: 12, background: '#f8f5f0', border: 'none', borderRadius: 10, fontSize: 14, color: '#888', cursor: 'pointer' }}>
              取消
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
