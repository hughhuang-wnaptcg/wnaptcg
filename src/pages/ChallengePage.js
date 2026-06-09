// src/pages/ChallengePage.js
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getLevel } from '../lib/supabase'
import { LevelBadge, PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'

// ── 動畫血條 ─────────────────────────────────────────
function AnimatedBar({ targetPct, color, height = 10, delay = 0 }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const duration = 1200
      const tick = (now) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setPct(Math.round(eased * targetPct))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [targetPct, delay])

  return (
    <div style={{ height, background: '#f0e8d0', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color,
        borderRadius: 99,
        transition: 'none',
        boxShadow: pct > 0 ? `0 0 8px ${color.includes('red') ? 'rgba(228,75,74,0.4)' : 'rgba(55,138,221,0.4)'}` : 'none',
      }} />
    </div>
  )
}

function normalizeReward(reward) {
  if (!reward) return null
  if (typeof reward === 'string') {
    const name = reward.trim()
    return name ? { name, desc: '' } : null
  }
  if (typeof reward !== 'object') return null
  const name = reward.name || reward.title || reward.label || reward.reward || reward.prize || reward.item || ''
  const desc = reward.desc || reward.description || reward.note || reward.detail || ''
  if (!name && !desc) return null
  return { name: name || desc, desc: name ? desc : '' }
}

function normalizeRewards(rewards) {
  if (!rewards) return []
  let value = rewards
  if (typeof value === 'string') {
    try { value = JSON.parse(value) } catch (e) {
      const single = normalizeReward(value)
      return single ? [single] : []
    }
  }
  if (Array.isArray(value)) return value.map(normalizeReward).filter(Boolean)
  if (Array.isArray(value?.rewards)) return value.rewards.map(normalizeReward).filter(Boolean)
  if (Array.isArray(value?.items)) return value.items.map(normalizeReward).filter(Boolean)
  if (Array.isArray(value?.data)) return value.data.map(normalizeReward).filter(Boolean)
  if (typeof value === 'object') {
    const list = Object.values(value).map(normalizeReward).filter(Boolean)
    if (list.length > 0) return list
  }
  const single = normalizeReward(value)
  return single ? [single] : []
}

function normalizeBossRewards(boss) {
  const fields = [
    boss?.rewards, boss?.reward, boss?.reward_list, boss?.reward_items,
    boss?.reward_text, boss?.reward_description, boss?.prizes, boss?.prize,
  ]
  for (const field of fields) {
    const rewards = normalizeRewards(field)
    if (rewards.length > 0) return rewards
  }
  return []
}

// ── 共同挑戰說明 Sheet ────────────────────────────────
function ChallengeHintSheet({ onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, background: '#fff', borderRadius: '16px 16px 0 0', padding: '0 0 40px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 16px' }} />
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FCEBEB', border: '0.5px solid #F09595', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-solid fa-shield" style={{ fontSize: 18, color: '#E24B4A' }}></i>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00' }}>什麼是共同挑戰？</div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>全體玩家一起挑戰</div>
            </div>
          </div>

          {[
            { icon: 'fa-users', color: '#378ADD', bg: '#EFF6FF', title: '共同對抗敵人', desc: '共同挑戰為全體玩家共同挑戰一個敵人，於結束日期前總消費大於敵人血量即挑戰成功。' },
            { icon: 'fa-gift', color: '#BA7517', bg: '#FFF3E0', title: '依消費比例發放獎勵', desc: '挑戰成功後，獎勵依照各玩家的消費比例進行分配，貢獻越高、獎勵越豐厚。' },
            { icon: 'fa-skull', color: '#A32D2D', bg: '#FCEBEB', title: '挑戰失敗規則', desc: '若挑戰失敗，不發放獎勵。但貢獻排名前三名的玩家可獲得安慰獎。' },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < arr.length - 1 ? '0.5px solid #f5f0e8' : 'none' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`fa-solid ${item.icon}`} style={{ fontSize: 18, color: item.color }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2D1A00', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}

          <button onClick={onClose}
            style={{ marginTop: 20, width: '100%', padding: 13, background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#A32D2D', cursor: 'pointer' }}>
            了解了
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ChallengePage() {
  const { member } = useAuth()
  const [boss, setBoss] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHint, setShowHint] = useState(false)  // ── 新增

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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 14, color: '#bbb' }}>
      載入中...
    </div>
  )

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    card: { border: '0.5px solid #f0e8d0', borderRadius: 12, padding: 14, background: '#fdfaf4', boxShadow: '0 1px 6px rgba(186,117,23,0.05)', marginBottom: 14 },
    secTitle: { fontSize: 13, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 },
  }

  // 等級以積分即時換算（徹底方案）
  const currentLevel = member ? getLevel(member.points || 0) : null

  if (!boss) return (
    <div style={S.page}>
      <div style={{ background: 'linear-gradient(135deg,#fff 0%,#fdfaf4 60%,#faf4e8 100%)', padding: '18px 20px 16px', position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid #f0e8d0' }}>
        <div style={{ position: 'absolute', bottom: -6, left: -6, fontSize: 72, opacity: 0.05, color: '#BA7517', lineHeight: 1 }}>
          <i className="fa-solid fa-shield" aria-hidden="true"></i>
        </div>
        <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fa-solid fa-shield" style={{ fontSize: 13, color: '#BA7517' }} aria-hidden="true"></i>共同挑戰
          <button onClick={() => setShowHint(true)} style={{ marginLeft: 4, width: 18, height: 18, borderRadius: '50%', background: '#F5E8C8', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
            <i className="fa-solid fa-question" style={{ fontSize: 8, color: '#BA7517' }}></i>
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
        <i className="fa-solid fa-shield" style={{ fontSize: 40, color: '#f0e8d0' }}></i>
        <div style={{ fontSize: 14, color: '#bbb' }}>本月尚未設定挑戰</div>
      </div>
      <BottomNav />
      {showHint && <ChallengeHintSheet onClose={() => setShowHint(false)} />}
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
  const rewards = normalizeBossRewards(boss)

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#fff 0%,#fdfaf4 60%,#faf4e8 100%)', padding: '18px 20px 16px', position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid #f0e8d0' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.07) 0%,transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -6, left: -6, fontSize: 72, opacity: 0.05, color: '#BA7517', lineHeight: 1, pointerEvents: 'none' }}>
          <i className="fa-solid fa-shield" aria-hidden="true"></i>
        </div>
        {[[10,20],[25,62],[8,42]].map(([t,l],i) => (
          <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width:2, height:2, borderRadius:'50%', background:'#BA7517', opacity:0.4+i*0.1 }} />
        ))}
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {member && <PokeballIcon level={currentLevel} size={24} />}
          <span style={{ fontSize: 6, color: '#BA7517', fontWeight: 600 }}>{currentLevel}</span>
        </div>
        <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
        {/* ── 標題列：共同挑戰 + ？icon ── */}
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <i className="fa-solid fa-shield" style={{ fontSize: 13, color: '#BA7517' }} aria-hidden="true"></i>
          共同挑戰
          <button
            onClick={() => setShowHint(true)}
            style={{ marginLeft: 4, width: 18, height: 18, borderRadius: '50%', background: '#F5E8C8', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
            <i className="fa-solid fa-question" style={{ fontSize: 8, color: '#BA7517' }}></i>
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#bbb' }}>本月挑戰 · {rankList.length} 人參與</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 0' }}>

        {/* Boss 卡片 */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #F09595', flexShrink: 0, overflow: 'hidden' }}>
              {boss.image_url
                ? <img src={boss.image_url} alt={boss.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block' }} />
                : null}
              <i className="fa-solid fa-shield" style={{ fontSize: 20, color: '#E24B4A', display: boss.image_url ? 'none' : 'block' }}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>{boss.name}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{boss.description || '本月挑戰'} · 每月{boss.reset_day}日重置</div>
            </div>
            <HpCounter targetHp={100 - progress} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 6 }}>
            <span>${boss.current_amount?.toLocaleString()}</span>
            <span>目標 ${boss.target_amount?.toLocaleString()}</span>
          </div>

          <AnimatedBar targetPct={progress} color="linear-gradient(90deg,#E24B4A,#EF9F27)" height={10} delay={300} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 12 }}>
            {[
              { num: rankList.length, label: '參與人數' },
              { num: `$${boss.current_amount?.toLocaleString()}`, label: '累積消費' },
              { num: `$${(boss.target_amount - boss.current_amount)?.toLocaleString()}`, label: '距目標' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#f8f5f0', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{s.num}</div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 獎勵 */}
        <div style={{ ...S.card, background: '#fff' }}>
          <div style={{ ...S.secTitle, marginBottom: 10 }}>
            <i className="fa-solid fa-gift" style={{ fontSize: 14, color: '#BA7517' }}></i>擊敗獎勵
            <span style={{ fontSize: 10, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', color: '#8B5A00', padding: '2px 8px', borderRadius: 20, border: '0.5px solid #FAC775', marginLeft: 'auto' }}>依消費比例分配</span>
          </div>
          {rewards.length > 0 ? rewards.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#fdfaf4', borderRadius: 8, border: '0.5px solid #f0e8d0', marginBottom: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #FAC775' }}>
                <i className="fa-solid fa-gift" style={{ fontSize: 14, color: '#BA7517' }}></i>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{r.name}</div>
                {r.desc && <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{r.desc}</div>}
              </div>
            </div>
          )) : (
            <div style={{ padding: 12, background: '#fdfaf4', borderRadius: 8, border: '0.5px solid #f0e8d0', fontSize: 12, color: '#999', textAlign: 'center' }}>
              尚未設定擊敗獎勵
            </div>
          )}
        </div>

        {/* 我的貢獻 */}
        {member && myAmount > 0 && (
          <div style={{ ...S.card, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={S.secTitle}>我的貢獻度</div>
              {myRank > 0 && <span style={{ fontSize: 11, background: '#E6F1FB', color: '#0C447C', padding: '3px 8px', borderRadius: 20 }}>第 {myRank} 名</span>}
            </div>
            <AnimatedBar targetPct={myPct} color="linear-gradient(90deg,#378ADD,#BA7517)" height={8} delay={600} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginTop: 5 }}>
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

      {/* ── 共同挑戰說明 Sheet ── */}
      {showHint && <ChallengeHintSheet onClose={() => setShowHint(false)} />}
    </div>
  )
}

// HP 數字從 100 倒數動畫
function HpCounter({ targetHp }) {
  const [hp, setHp] = useState(100)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const duration = 1200
      const startHp = 100
      const tick = (now) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setHp(Math.round(startHp - eased * (startHp - targetHp)))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, 300)
    return () => clearTimeout(t)
  }, [targetHp])

  return (
    <div style={{ fontSize: 13, color: hp > 50 ? '#A32D2D' : hp > 25 ? '#BA7517' : '#E24B4A', fontWeight: 700, transition: 'color 0.5s' }}>
      HP {hp}%
    </div>
  )
}
