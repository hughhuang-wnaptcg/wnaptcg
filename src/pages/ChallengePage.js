import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import TopBar from '../components/TopBar'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'

export default function ChallengePage() {
  const { member } = useAuth()
  const [boss, setBoss] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: bossData } = await supabase.from('boss_challenges')
      .select('*').eq('is_active', true).single()
    if (bossData) {
      setBoss(bossData)
      const { data: pData } = await supabase.from('boss_purchases')
        .select('*, members(display_name, level)')
        .eq('boss_id', bossData.id)
        .order('amount', { ascending: false })
      setPurchases(pData || [])
    }
    setLoading(false)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 14, color: '#aaa' }}>載入中...</div>
  if (!boss) return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 40 }}>⚔️</span>
        <div style={{ fontSize: 14, color: '#aaa' }}>本月尚未設定挑戰</div>
      </div>
      <BottomNav />
    </div>
  )

  const progress = Math.round((boss.current_amount / boss.target_amount) * 100)
  const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0)
  const myPurchases = purchases.filter(p => p.members?.display_name === member?.display_name)
  const myAmount = myPurchases.reduce((sum, p) => sum + p.amount, 0)
  const myPct = totalAmount > 0 ? Math.round((myAmount / totalAmount) * 100) : 0
  const myRank = purchases.findIndex(p => p.members?.display_name === member?.display_name) + 1

  // 群組消費by會員
  const memberMap = {}
  purchases.forEach(p => {
    const name = p.members?.display_name || '未知'
    if (!memberMap[name]) memberMap[name] = { name, level: p.members?.level, amount: 0 }
    memberMap[name].amount += p.amount
  })
  const rankList = Object.values(memberMap).sort((a, b) => b.amount - a.amount)

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>

        {/* Boss卡片 */}
        <div style={{ fontSize: 15, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>⚔️ 本月挑戰</div>
        <div style={{ border: '0.5px solid #e5e5e5', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: 16, borderBottom: '0.5px solid #e5e5e5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '0.5px solid #F09595' }}>⚔️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#111' }}>{boss.name}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{boss.description || '本月挑戰'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#999' }}>重置日</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#A32D2D' }}>每月{boss.reset_day}日</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 6 }}>
              <span>HP 剩餘</span>
              <span style={{ color: '#A32D2D', fontWeight: 500 }}>{100 - progress}% · 進度 {progress}%</span>
            </div>
            <div style={{ height: 12, background: '#f5f5f5', borderRadius: 99, overflow: 'hidden', border: '0.5px solid #e5e5e5', marginBottom: 5 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#E24B4A', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa' }}>
              <span>${boss.current_amount?.toLocaleString()} 累積</span>
              <span>目標 ${boss.target_amount?.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {[
              { num: rankList.length, label: '參與人數' },
              { num: `$${boss.current_amount?.toLocaleString()}`, label: '累積消費' },
              { num: `$${(boss.target_amount - boss.current_amount)?.toLocaleString()}`, label: '距離目標' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '12px 8px', textAlign: 'center', borderRight: i < 2 ? '0.5px solid #e5e5e5' : 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{s.num}</div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 獎勵 */}
        {boss.rewards?.length > 0 && (
          <div style={{ border: '0.5px solid #e5e5e5', borderRadius: 14, padding: 14, background: '#f8f8f8', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>🎁 擊敗獎勵</div>
              <span style={{ fontSize: 11, background: '#FAEEDA', color: '#633806', padding: '3px 8px', borderRadius: 20 }}>依消費比例分配</span>
            </div>
            {boss.rewards.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', borderRadius: 10, border: '0.5px solid #e5e5e5', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎁</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{r.name}</div>
                  {r.desc && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{r.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 我的貢獻 */}
        {member && (
          <div style={{ border: '0.5px solid #e5e5e5', borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>我的貢獻度</div>
              {myRank > 0 && <span style={{ fontSize: 11, background: '#E6F1FB', color: '#0C447C', padding: '3px 8px', borderRadius: 20 }}>第 {myRank} 名</span>}
            </div>
            <div style={{ height: 8, background: '#f5f5f5', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${myPct}%`, background: '#378ADD', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
              <span>消費 ${myAmount.toLocaleString()} · 佔 {myPct}%</span>
              <span>預估獎勵 {myPct}%</span>
            </div>
          </div>
        )}

        {/* 排行榜 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>📊 貢獻排行</div>
          {rankList.slice(0, 3).map((m, i) => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: i < 3 ? '#BA7517' : '#aaa', width: 20, textAlign: 'center' }}>{i + 1}</div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#633806' }}>{m.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#999' }}><LevelBadge level={m.level} size='sm' /></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>${m.amount.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{totalAmount > 0 ? Math.round(m.amount / totalAmount * 100) : 0}%</div>
              </div>
            </div>
          ))}
          {/* 我的排名（如果不在前三） */}
          {myRank > 3 && member && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', background: '#f0f7ff', borderRadius: 8, marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#378ADD', width: 20, textAlign: 'center' }}>{myRank}</div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#633806', border: '1.5px solid #378ADD' }}>{member.display_name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0C447C' }}>{member.display_name}（我）</div>
                <div style={{ fontSize: 11, color: '#999' }}><LevelBadge level={member.level} size='sm' /></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>${myAmount.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{myPct}%</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
