import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getLevel, LEVELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import TopBar from '../components/TopBar'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'

export default function HomePage() {
  const { member } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ memberCount: 0, cardCount: 0 })
  const [boss, setBoss] = useState(null)
  const [recentCards, setRecentCards] = useState([])
  const [weekLogins, setWeekLogins] = useState([])
  const [announcement, setAnnouncement] = useState("{announcement}")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ count: memberCount }, { count: cardCount }, { data: bossData }, { data: cardsData }] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('cards').select('*', { count: 'exact', head: true }),
      supabase.from('boss_challenges').select('*, boss_purchases(amount)').eq('is_active', true).single(),
      supabase.from('cards').select('*, card_owners(member_id, members(display_name))').order('created_at', { ascending: false }).limit(3),
    ])
    setStats({ memberCount: memberCount || 0, cardCount: cardCount || 0 })
    setBoss(bossData)
    setRecentCards(cardsData || [])

    const { data: announcementData } = await supabase.from("settings").select("value").eq("key", "announcement").single()
    if (announcementData) setAnnouncement(JSON.parse(announcementData.value))

    if (member) {
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        days.push(d.toISOString().split('T')[0])
      }
      const { data: loginData } = await supabase.from('daily_logins')
        .select('login_date').eq('member_id', member.id)
        .in('login_date', days)
      const loginDates = new Set((loginData || []).map(l => l.login_date))
      setWeekLogins(days.map(d => ({ date: d, done: loginDates.has(d) })))
    }
  }

  const bossProgress = boss ? Math.round((boss.current_amount / boss.target_amount) * 100) : 0
  const nextLevel = LEVELS.find(l => l.min > (member?.points || 0))
  const currentLevelMin = LEVELS.slice().reverse().find(l => (member?.points || 0) >= l.min)?.min || 0
  const levelProgress = nextLevel ? Math.round(((member?.points || 0) - currentLevelMin) / (nextLevel.min - currentLevelMin) * 100) : 100

  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero */}
        <div style={{ padding: '28px 20px 24px', borderBottom: '0.5px solid #e5e5e5' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FCEBEB', color: '#A32D2D', fontSize: 12, padding: '4px 12px', borderRadius: 20, marginBottom: 14 }}>
            {announcement}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#111', lineHeight: 1.35, marginBottom: 8 }}>
            歡迎回來，<span style={{ color: '#E24B4A' }}>{member?.display_name || 'Trainer'}</span><br />今天要開什麼包？
          </h1>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>加入會員，累積積分、見證每次開箱的歷史時刻。</p>
        </div>



        {/* 戰績牆預覽 */}
        <div style={{ padding: '22px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 7 }}>🏆 戰績牆</div>
            <span style={{ fontSize: 12, color: '#999', cursor: 'pointer' }} onClick={() => navigate('/wall')}>全部 →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
            {recentCards.map(card => (
              <div key={card.id} onClick={() => navigate('/wall')} style={{ border: '0.5px solid #e5e5e5', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ aspectRatio: '3/4', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {card.image_url ? <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28, color: '#ddd' }}>🎴</span>}
                  <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 500, padding: '2px 6px', borderRadius: 20, background: '#FCEBEB', color: '#791F1F' }}>{card.rarity}</span>
                </div>
                <div style={{ padding: '8px 8px 10px' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#111', marginBottom: 2 }}>{card.name}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{card.series}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Boss挑戰 */}
        {boss && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>⚔️ 共同挑戰</div>
              <span style={{ fontSize: 12, color: '#999', cursor: 'pointer' }} onClick={() => navigate('/challenge')}>詳情 →</span>
            </div>
            <div style={{ border: '0.5px solid #e5e5e5', borderRadius: 12, padding: 14, background: '#f8f8f8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: '0.5px solid #F09595' }}>⚔️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{boss.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>每月 {boss.reset_day} 日重置</div>
                </div>
                <div style={{ fontSize: 12, color: '#A32D2D', fontWeight: 500 }}>HP {100 - bossProgress}%</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 5 }}>
                <span>共同消費進度</span>
                <span>${boss.current_amount?.toLocaleString()} / ${boss.target_amount?.toLocaleString()}</span>
              </div>
              <div style={{ height: 10, background: '#fff', borderRadius: 99, overflow: 'hidden', border: '0.5px solid #e5e5e5' }}>
                <div style={{ height: '100%', width: `${bossProgress}%`, background: '#E24B4A', borderRadius: 99 }} />
              </div>
            </div>
          </div>
        )}

        {/* 等級進度 */}
        {member && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ border: '0.5px solid #e5e5e5', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.display_name}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#633806', border: '1.5px solid #FAC775' }}>
                    {member.display_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 4 }}>{member.display_name}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FAEEDA', color: '#633806', fontSize: 11, padding: '3px 8px', borderRadius: 20 }}>
                    <PokeballIcon level={member.level} size={16} /> {member.level}
                  </div>
                </div>
                {nextLevel && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#999' }}>距離{nextLevel.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>+{(nextLevel.min - member.points).toLocaleString()} 點</div>
                  </div>
                )}
              </div>
              <div style={{ height: 8, background: '#f5f5f5', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${levelProgress}%`, background: '#BA7517', borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa' }}>
                <span>{member.points?.toLocaleString()} 點</span>
                <span>{levelProgress}%</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 10 }}>
                {[
                  { num: member.points?.toLocaleString(), label: '累積積分' },
                  { num: member.login_streak, label: '連續登入' },
                  { num: `$${member.total_spent?.toLocaleString()}`, label: '累積消費' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#f8f8f8', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{s.num}</div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 本週簽到 */}
        {weekLogins.length > 0 && (
          <div style={{ padding: '0 20px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>📅 本週簽到</div>
              <span style={{ fontSize: 11, background: '#EAF3DE', color: '#27500A', padding: '3px 8px', borderRadius: 20 }}>+50 點全勤加成</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
              {weekLogins.map((d, i) => (
                <div key={d.date} style={{
                  aspectRatio: 1, borderRadius: 8, border: '0.5px solid #e5e5e5',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                  fontSize: 9,
                  background: d.date === today ? '#E24B4A' : d.done ? '#FCEBEB' : '#fff',
                  borderColor: d.date === today ? '#E24B4A' : d.done ? '#F09595' : '#e5e5e5',
                  color: d.date === today ? 'white' : d.done ? '#791F1F' : '#999',
                }}>
                  <span style={{ fontSize: 12 }}>{d.done || d.date === today ? '✓' : '○'}</span>
                  <span>{dayNames[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
