import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, LEVELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon } from '../lib/pokeballs'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function HomePage() {
  const { member } = useAuth()
  const navigate = useNavigate()
  const [boss, setBoss] = useState(null)
  const [recentCards, setRecentCards] = useState([])
  const [weekLogins, setWeekLogins] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const [news, setNews] = useState(null)
  const [todayPoints, setTodayPoints] = useState(0)

  useEffect(() => { fetchData() }, [member])

  async function fetchData() {
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
      const pts = (loginData || []).reduce((s, l) => s + l.points, 0)
      setTodayPoints(pts)

      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000)
        days.push(d.toISOString().split('T')[0])
      }
      const { data: weekData } = await supabase.from('daily_logins')
        .select('login_date').eq('member_id', member.id).in('login_date', days)
      const loginDates = new Set((weekData || []).map(l => l.login_date))
      setWeekLogins(days.map(d => ({ date: d, done: loginDates.has(d) })))
    }
  }

  const bossProgress = boss ? Math.round((boss.current_amount / boss.target_amount) * 100) : 0
  const nextLevel = LEVELS.find(l => l.min > (member?.points || 0))
  const currentLevelMin = LEVELS.slice().reverse().find(l => (member?.points || 0) >= l.min)?.min || 0
  const levelProgress = nextLevel ? Math.round(((member?.points || 0) - currentLevelMin) / (nextLevel.min - currentLevelMin) * 100) : 100
  const today = new Date().toISOString().split('T')[0]
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  const hour = new Date().getHours()
  const greeting = hour >= 5 && hour < 12 ? { text: '早安', icon: 'fa-sun' } : hour >= 12 && hour < 18 ? { text: '午安', icon: 'fa-sun' } : { text: '晚安', icon: 'fa-moon' }

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    hero: { background: 'linear-gradient(135deg,#fff 0%,#fdfaf4 60%,#faf4e8 100%)', padding: '22px 20px 20px', position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid #f0e8d0' },
    glow1: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.08) 0%,transparent 70%)' },
    glow2: { position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.05) 0%,transparent 70%)' },
    goldLine1: { position: 'absolute', background: 'linear-gradient(90deg,transparent,#BA7517,transparent)', height: 0.5, opacity: 0.2, width: 100, top: '30%', left: -10 },
    goldLine2: { position: 'absolute', background: 'linear-gradient(90deg,transparent,#BA7517,transparent)', height: 0.5, opacity: 0.2, width: 80, top: '68%', right: -10 },
    levelBadge: { position: 'absolute', top: 18, right: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
    logoSmall: { fontSize: 10, fontWeight: 600, color: '#BA7517', letterSpacing: '0.12em', opacity: 0.6, marginBottom: 10 },
    greetLine: { fontSize: 11, color: '#BA7517', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 },
    heroTitle: { fontSize: 18, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.35, marginBottom: 10 },
    todayPts: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg,#FAEEDA,#FFF8EE)', border: '0.5px solid #FAC775', color: '#8B5A00', fontSize: 11, padding: '5px 12px', borderRadius: 20, boxShadow: '0 1px 6px rgba(186,117,23,0.1)' },
    announce: { background: '#fff', padding: '10px 20px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', gap: 8 },
    announceBadge: { fontSize: 9, fontWeight: 600, color: '#BA7517', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border: '0.5px solid #FAC775', padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
    news: { background: '#fff', padding: '12px 20px', borderBottom: '0.5px solid #f5f0e8' },
    newsHeader: { fontSize: 11, fontWeight: 500, color: '#888', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 },
    newsCard: { background: 'linear-gradient(135deg,#fdfaf4,#fff)', border: '0.5px solid #f0e8d0', borderRadius: 8, overflow: 'hidden', display: 'flex', boxShadow: '0 1px 6px rgba(186,117,23,0.05)' },
    newsImg: { width: 80, minHeight: 64, background: 'linear-gradient(135deg,#f5ede0,#f0e8d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
    newsBody: { padding: '8px 10px', flex: 1 },
    content: { padding: '16px 20px 0' },
    secTitle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    secLeft: { fontSize: 14, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6 },
    secAll: { fontSize: 12, color: '#bbb', cursor: 'pointer' },
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
      <TopBar />
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Hero */}
        <div style={S.hero}>
          <div style={S.glow1} /><div style={S.glow2} />
          <div style={S.goldLine1} /><div style={S.goldLine2} />
          {/* 星星 */}
          {[[12,15],[8,55],[22,80],[35,25],[15,40],[6,70],[42,8],[30,90]].map(([t,l],i) => (
            <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width: i%2===0?2:3, height: i%2===0?2:3, borderRadius:'50%', background:'#BA7517', opacity: 0.3+i*0.05 }} />
          ))}
          <div style={S.levelBadge}>
            {member && <PokeballIcon level={member.level} size={34} />}
            <span style={{ fontSize: 8, color: '#BA7517', fontWeight: 600, letterSpacing: '0.06em' }}>{member?.level}</span>
          </div>
          <div style={S.logoSmall}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={S.greetLine}>
            <i className={`fa-solid ${greeting.icon}`} style={{ fontSize: 13 }}></i>
            {greeting.text}，{member?.display_name || 'Trainer'}
          </div>
          <div style={S.heroTitle}>今天要開什麼包？</div>
          {todayPoints > 0 && (
            <div style={S.todayPts}>
              <i className="fa-solid fa-star" style={{ fontSize: 12, color: '#BA7517' }}></i>
              今日已獲得 <strong style={{ color: '#BA7517', margin: '0 2px' }}>+{todayPoints}</strong> 點
            </div>
          )}
        </div>

        {/* 公告 */}
        {announcement && (
          <div style={S.announce}>
            <span style={S.announceBadge}>公告</span>
            <span style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{announcement}</span>
          </div>
        )}

        {/* 每日新聞 */}
        {news && (
          <div style={S.news}>
            <div style={S.newsHeader}>
              <i className="fa-solid fa-newspaper" style={{ fontSize: 13, color: '#BA7517' }}></i>
              每日新聞
            </div>
            <div style={S.newsCard}>
              <div style={S.newsImg}>
                {news.image_url
                  ? <img src={news.image_url} alt="news" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <i className="fa-solid fa-image" style={{ fontSize: 20, color: '#D4A94A' }}></i>}
              </div>
              <div style={S.newsBody}>
                <div style={{ fontSize: 8, color: '#BA7517', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>最新消息</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#222', lineHeight: 1.45 }}>{news.title}</div>
                <div style={{ fontSize: 9, color: '#bbb', marginTop: 4 }}>{news.date}</div>
              </div>
            </div>
          </div>
        )}

        {/* 戰績牆 */}
        <div style={S.content}>
          <div style={S.secTitle}>
            <div style={S.secLeft}>
              <i className="fa-solid fa-trophy" style={{ fontSize: 14, color: '#BA7517' }}></i>戰績牆
            </div>
            <span style={S.secAll} onClick={() => navigate('/wall')}>全部 →</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
            {recentCards.map((card, idx) => (
              <div key={card.id} onClick={() => navigate('/wall')} style={S.card}>
                <div style={{ aspectRatio: '3/4', background: '#f8f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {card.image_url
                    ? <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <i className="fa-solid fa-id-card" style={{ fontSize: 28, color: '#D4A94A', opacity: 0.4 }}></i>}
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
              <div style={S.secTitle}>
                <div style={S.secLeft}>
                  <i className="fa-solid fa-shield" style={{ fontSize: 14, color: '#BA7517' }}></i>共同挑戰
                </div>
                <span style={S.secAll} onClick={() => navigate('/challenge')}>詳情 →</span>
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
              <div style={{ ...S.secTitle, marginBottom: 12 }}>
                <div style={S.secLeft}>
                  <i className="fa-solid fa-medal" style={{ fontSize: 14, color: '#BA7517' }}></i>我的進度
                </div>
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
                  <span>{member.points?.toLocaleString()} 點</span>
                  <span>{levelProgress}%</span>
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
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={S.secLeft}>
                  <i className="fa-solid fa-calendar-check" style={{ fontSize: 14, color: '#BA7517' }}></i>本週簽到
                </div>
                <span style={{ fontSize: 10, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', color: '#8B5A00', padding: '3px 8px', borderRadius: 20, border: '0.5px solid #FAC775' }}>+50 點全勤</span>
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
      <BottomNav />
    </div>
  )
}
