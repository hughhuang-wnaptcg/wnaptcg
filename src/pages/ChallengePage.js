import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { LevelBadge } from '../lib/pokeballs'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function ChallengePage() {
  const { member } = useAuth()
  const [boss, setBoss] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: bossData } = await supabase.from('boss_challenges').select('*').eq('is_active', true).single()
    if (bossData) {
      setBoss(bossData)
      const { data: pData } = await supabase.from('boss_purchases')
        .select('*, members(display_name, level, avatar_url)')
        .eq('boss_id', bossData.id).order('amount', { ascending: false })
      setPurchases(pData || [])
    }
    setLoading(false)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 14, color: '#bbb' }}>載入中...</div>

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    pageTitle: { padding: '14px 20px 12px', borderBottom: '0.5px solid #f5f0e8' },
    card: { border: '0.5px solid #f0e8d0', borderRadius: 12, padding: 14, background: '#fdfaf4', boxShadow: '0 1px 6px rgba(186,117,23,0.05)', marginBottom: 14 },
    secTitle: { fontSize: 13, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 },
  }

  if (!boss) return (
    <div style={S.page}>
      <TopBar />
      <div style={S.pageTitle}>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-shield" style={{ color: '#BA7517' }}></i>共同挑戰
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
        <i className="fa-solid fa-shield" style={{ fontSize: 40, color: '#f0e8d0' }}></i>
        <div style={{ fontSize: 14, color: '#bbb' }}>本月尚未設定挑戰</div>
      </div>
      <BottomNav />
    </div>
  )

  const progress = Math.round((boss.current_amount / boss.target_amount) * 100)
  const memberMap = {}
  purchases.forEach(p => {
    const name = p.members?.display_name || '未知'
    if (!memberMap[name]) memberMap[name] = { name, level: p.members?.level, avatar_url: p.members?.avatar_url, amount: 0 }
    memberMap[name].amount += p.amount
  })
  const rankList = Object.values(memberMap).sort((a, b) => b.amount - a.amount)
  const totalAmount = rankList.reduce((s, m) => s + m.amount, 0)
  const myRank = rankList.findIndex(m => m.name === member?.display_name) + 1
  const myAmount = rankList.find(m => m.name === member?.display_name)?.amount || 0
  const myPct = totalAmount > 0 ? Math.round(myAmount / totalAmount * 100) : 0

  return (
    <div style={S.page}>
      <TopBar />

      <div style={S.pageTitle}>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <i className="fa-solid fa-shield" style={{ fontSize: 16, color: '#BA7517' }}></i>共同挑戰
        </div>
        <div style={{ fontSize: 12, color: '#bbb' }}>本月挑戰 · {rankList.length} 人參與</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 0' }}>

        {/* Boss卡片 */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #F09595' }}>
              <i className="fa-solid fa-shield" style={{ fontSize: 20, color: '#E24B4A' }}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>{boss.name}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{boss.description || '本月挑戰'} · 每月{boss.reset_day}日重置</div>
            </div>
            <div style={{ fontSize: 12, color: '#A32D2D', fontWeight: 600 }}>HP {100 - progress}%</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 5 }}>
            <span>${boss.current_amount?.toLocaleString()}</span>
            <span>目標 ${boss.target_amount?.toLocaleString()}</span>
          </div>
          <div style={{ height: 10, background: '#f0e8d0', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#E24B4A,#EF9F27)', borderRadius: 99 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {[{ num: rankList.length, label: '參與人數' }, { num: `$${boss.current_amount?.toLocaleString()}`, label: '累積消費' }, { num: `$${(boss.target_amount - boss.current_amount)?.toLocaleString()}`, label: '距目標' }].map((s, i) => (
              <div key={i} style={{ background: '#f8f5f0', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{s.num}</div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 獎勵 */}
        {boss.rewards?.length > 0 && (
          <div style={{ ...S.card, background: '#fff' }}>
            <div style={{ ...S.secTitle, marginBottom: 10 }}>
              <i className="fa-solid fa-gift" style={{ fontSize: 14, color: '#BA7517' }}></i>擊敗獎勵
              <span style={{ fontSize: 10, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', color: '#8B5A00', padding: '2px 8px', borderRadius: 20, border: '0.5px solid #FAC775', marginLeft: 'auto' }}>依消費比例分配</span>
            </div>
            {boss.rewards.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#fdfaf4', borderRadius: 8, border: '0.5px solid #f0e8d0', marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #FAC775' }}>
                  <i className="fa-solid fa-gift" style={{ fontSize: 14, color: '#BA7517' }}></i>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{r.name}</div>
                  {r.desc && <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{r.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 我的貢獻 */}
        {member && myAmount > 0 && (
          <div style={{ ...S.card, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={S.secTitle}>我的貢獻度</div>
              {myRank > 0 && <span style={{ fontSize: 11, background: '#E6F1FB', color: '#0C447C', padding: '3px 8px', borderRadius: 20 }}>第 {myRank} 名</span>}
            </div>
            <div style={{ height: 8, background: '#f0e8d0', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
              <div style={{ height: '100%', width: `${myPct}%`, background: 'linear-gradient(90deg,#378ADD,#BA7517)', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
              <span>消費 ${myAmount.toLocaleString()} · 佔 {myPct}%</span>
              <span>預估獎勵 {myPct}%</span>
            </div>
          </div>
        )}

        {/* 排行榜 */}
        <div style={{ marginBottom: 28 }}>
          <div style={S.secTitle}>
            <i className="fa-solid fa-ranking-star" style={{ fontSize: 14, color: '#BA7517' }}></i>貢獻排行
          </div>
          {rankList.map((m, i) => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #f5f0e8' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: i < 3 ? '#BA7517' : '#bbb', width: 20, textAlign: 'center' }}>{i + 1}</div>
              {m.avatar_url
                ? <img src={m.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid #FAC775' }} />
                : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#633806', border: '0.5px solid #FAC775' }}>{m.name[0]}</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{m.name}</div>
                <LevelBadge level={m.level} size='sm' />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>${m.amount.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{totalAmount > 0 ? Math.round(m.amount / totalAmount * 100) : 0}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
