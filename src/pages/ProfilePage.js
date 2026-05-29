import React, { useEffect, useState } from 'react'
import { supabase, LEVELS, getNextLevel } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import TopBar from '../components/TopBar'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'
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
      .select('*').eq('member_id', member.id)
      .order('created_at', { ascending: false }).limit(10)
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

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar right={
        <span style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => { setEditName(member.display_name || ''); setShowSettings(true) }}><i className="fa-solid fa-gear" style={{fontSize:18}} aria-hidden="true"></i></span>
      } />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '0.5px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: 14 }}>
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.display_name}
              style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FAC775', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, color: '#633806', border: '2px solid #FAC775', flexShrink: 0 }}>
              {member.display_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#111' }}>{member.display_name}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>會員編號 #{String(member.member_no || '0').padStart(4, '0')}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E6F1FB', color: '#0C447C', fontSize: 12, padding: '4px 10px', borderRadius: 20, marginTop: 6 }}>
              <PokeballIcon level={member.level} size={16} /> {member.level}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}><i className="fa-solid fa-medal" style={{color:"#E24B4A",marginRight:6}} aria-hidden="true"></i>等級進度</div>
          <div style={{ border: '0.5px solid #e5e5e5', borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LevelBadge level={member.level} size='md' />
                <span style={{ fontSize: 13, color: '#aaa' }}>→</span>
                {nextLevel && <LevelBadge level={nextLevel.name} size='md' />}
              </div>
              {nextLevel && <span style={{ fontSize: 11, color: '#999' }}>還差 {(nextLevel.min - member.points).toLocaleString()} 點</span>}
            </div>
            <div style={{ height: 10, background: '#f5f5f5', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
              <div style={{ height: '100%', width: `${levelProgress}%`, background: '#378ADD', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa' }}>
              <span>{member.points?.toLocaleString()} 點</span>
              <span>{levelProgress}%</span>
            </div>
          </div>

          <div style={{ border: '0.5px solid #e5e5e5', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            {LEVELS.map((l, i) => {
              const isDone = member.points >= l.min
              const isCurrent = member.level === l.name
              return (
                <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < LEVELS.length - 1 ? '0.5px solid #f0f0f0' : 'none', background: isCurrent ? '#EBF4FF' : 'transparent', opacity: isDone || isCurrent ? 1 : 0.5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: isDone && !isCurrent ? '#639922' : isCurrent ? '#378ADD' : '#ddd' }} />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: isCurrent ? '#0C447C' : '#111' }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: isCurrent ? '#185FA5' : '#999' }}>{i === 0 ? '初始會員' : `${l.min.toLocaleString()} 點`}</div>
                  {isDone && !isCurrent && <i className="fa-solid fa-check" style={{fontSize:13,color:'#639922'}} aria-hidden="true"></i>}
                  {isCurrent && <span style={{ fontSize: 11, background: '#E6F1FB', color: '#0C447C', padding: '2px 7px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 3 }}><PokeballIcon level={l.name} size={12} /> 目前</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 12 }}><i className="fa-solid fa-chart-bar" style={{color:"#E24B4A",marginRight:6}} aria-hidden="true"></i>我的數據</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {[
              { num: member.points?.toLocaleString(), label: '累積積分' },
              { num: `$${member.total_spent?.toLocaleString()}`, label: '累積消費' },
              { num: member.login_streak, label: '連續登入天數' },
              { num: member.total_logins, label: '總登入天數' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#f8f8f8', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 500, color: '#111' }}>{s.num}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ border: '0.5px solid #e5e5e5', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>本週簽到</div>
              <span style={{ fontSize: 12, background: '#EAF3DE', color: '#27500A', padding: '3px 8px', borderRadius: 20 }}>連續 {member.login_streak} 天</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 8 }}>
              {weekLogins.map((d, i) => (
                <div key={d.date} style={{
                  aspectRatio: 1, borderRadius: 7, border: '0.5px solid #e5e5e5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: 9,
                  background: d.date === today ? '#E24B4A' : d.done ? '#FCEBEB' : '#fff',
                  borderColor: d.date === today ? '#E24B4A' : d.done ? '#F09595' : '#e5e5e5',
                  color: d.date === today ? 'white' : d.done ? '#791F1F' : '#aaa',
                }}>
                  <span style={{ fontSize: 12 }}>{d.done || d.date === today ? <i className="fa-solid fa-check" aria-hidden="true"></i> : <i className="fa-regular fa-circle" aria-hidden="true"></i>}</span>
                  <span>{dayNames[i]}</span>
                </div>
              ))}
            </div>
            {daysUntilFullStreak <= 3 && (
              <div style={{ fontSize: 11, color: '#888' }}><i className="fa-solid fa-gift" style={{marginRight:4}} aria-hidden="true"></i>再 {daysUntilFullStreak} 天全勤可獲得 +15 點</div>
            )}
          </div>
        </div>

        <div style={{ padding: '0 20px 28px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 12 }}><i className="fa-solid fa-clock-rotate-left" style={{color:"#E24B4A",marginRight:6}} aria-hidden="true"></i>積分紀錄</div>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: logColors[log.type] || '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                <i className={`fa-solid ${logIcons[log.type] || "fa-pen"}`} style={{fontSize:16,color:"#666"}} aria-hidden="true"></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{log.note || log.type}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{new Date(log.created_at).toLocaleDateString('zh-TW')}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: log.points > 0 ? '#3B6D11' : '#A32D2D' }}>
                {log.points > 0 ? '+' : ''}{log.points}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 設定彈出視窗 */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: 20 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: '#111', marginBottom: 16 }}>設定</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 6 }}>暱稱</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="輸入你的暱稱"
                style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 14, color: '#111', outline: 'none' }}
              />
            </div>

            <button onClick={handleSaveName} disabled={saving}
              style={{ width: '100%', padding: 12, background: saving ? '#ccc' : '#E24B4A', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'white', cursor: 'pointer', marginBottom: 10 }}>
              {saving ? '儲存中...' : '儲存暱稱'}
            </button>

            <button onClick={signOut}
              style={{ width: '100%', padding: 12, background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, fontSize: 14, color: '#999', cursor: 'pointer', marginBottom: 10 }}>
              登出
            </button>

            <button onClick={() => setShowSettings(false)}
              style={{ width: '100%', padding: 12, background: '#f5f5f5', border: 'none', borderRadius: 10, fontSize: 14, color: '#666', cursor: 'pointer' }}>
              取消
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
