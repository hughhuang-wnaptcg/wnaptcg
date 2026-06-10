// src/pages/ChallengePage.js
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getLevel } from '../lib/supabase'
import { LevelBadge, PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'
import { playSound } from '../lib/sounds'
import { vibrate, VIBRATE } from '../lib/haptics'
import { SkeletonPanel, SkeletonList } from '../components/Skeleton'

function BossHpBar({ targetPct, delay = 0 }) {
  const [pct, setPct] = useState(100)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const duration = 1600
      const tick = (now) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setPct(Math.round(100 - eased * (100 - targetPct)))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [targetPct, delay])

  const barColor = pct > 50 ? '#C0392B' : pct > 25 ? '#BA7517' : '#E24B4A'
  return (
    <div style={{ height: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 99, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.1)' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, position: 'relative', transition: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'rgba(255,255,255,0.22)', borderRadius: '99px 99px 0 0' }} />
      </div>
    </div>
  )
}

function HpPctCounter({ targetPct, delay = 0 }) {
  const [pct, setPct] = useState(100)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const duration = 1600
      const tick = (now) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setPct(Math.round(100 - eased * (100 - targetPct)))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [targetPct, delay])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}</span>
}

function AnimatedBar({ targetPct, color, height = 7, delay = 0 }) {
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
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'none' }} />
    </div>
  )
}

function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return '剛剛'
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}時前`
  return `${Math.floor(diff / 86400)}天前`
}

function parseMilestones(boss) {
  try {
    const r = boss?.rewards
    const val = typeof r === 'string' ? JSON.parse(r) : r
    if (val?.milestones && Array.isArray(val.milestones)) return val.milestones
  } catch (e) {}
  return [
    { pct: 25, label: '討伐 25%', reward: '' },
    { pct: 50, label: '討伐 50%', reward: '' },
    { pct: 75, label: '討伐 75%', reward: '' },
    { pct: 100, label: '最終大獎', reward: '' },
  ]
}

const MILESTONE_ICONS = ['fa-star', 'fa-fire', 'fa-bolt', 'fa-crown']

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
          <button onClick={onClose} className="press-fx" style={{ marginTop: 20, width: '100%', padding: 13, background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#A32D2D', cursor: 'pointer' }}>
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
  const [recentPurchases, setRecentPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHint, setShowHint] = useState(false)

  // 記住上一次偵測到的討伐百分比，避免重播音效
  const prevDamagedPctRef = useRef(null)
  // 確保「進頁成就音」只播一次
  const introSoundPlayedRef = useRef(false)

  useEffect(() => { fetchData() }, [])

  // ── Realtime：監聽當前 Boss 的傷害紀錄，有人造成傷害就即時更新 ──
  // 新增 boss_purchases 時自動 re-fetch，觸發上方 fetchData 內的
  // 「跨里程碑 / 擊敗 Boss」音效＋震動偵測，HP 條與戰報也即時刷新。
  // 依賴 boss?.id：拿到 Boss 後才訂閱、換 Boss 重新訂閱、離開頁面時清理。
  useEffect(() => {
    if (!boss?.id) return
    const channel = supabase
      .channel(`boss_purchases_realtime_${boss.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'boss_purchases',
        filter: `boss_id=eq.${boss.id}`,
      }, () => { fetchData() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [boss?.id])

  async function fetchData() {
    const { data: bossData } = await supabase.from('boss_challenges').select('*').eq('is_active', true).single()
    if (bossData) {
      setBoss(bossData)
      const [{ data: pData }, { data: recentData }] = await Promise.all([
        supabase.from('boss_purchases')
          .select('*, members(display_name, level, avatar_url)')
          .eq('boss_id', bossData.id)
          .order('amount', { ascending: false }),
        supabase.from('boss_purchases')
          .select('*, members(display_name)')
          .eq('boss_id', bossData.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])
      setPurchases(pData || [])
      setRecentPurchases(recentData || [])

      // ── 音效偵測 ──
      const dmgPct = Math.min(Math.round((bossData.current_amount / bossData.target_amount) * 100), 100)
      const ms = parseMilestones(bossData)
      const prev = prevDamagedPctRef.current

      if (prev === null) {
        // 首次載入：播放一次「進頁成就音」反映目前最高進度
        if (!introSoundPlayedRef.current) {
          introSoundPlayedRef.current = true
          if (dmgPct >= 100) {
            playSound('boss_defeated'); vibrate(VIBRATE.weekComplete)
          } else {
            // 找出目前已解鎖的最高里程碑，播對應音
            const unlocked = ms.filter(m => dmgPct >= m.pct)
            if (unlocked.length > 0) { playSound('milestone'); vibrate(VIBRATE.success) }
          }
        }
      } else if (dmgPct > prev) {
        // 後續更新：偵測是否跨過新的里程碑或擊敗 Boss
        if (dmgPct >= 100 && prev < 100) {
          playSound('boss_defeated'); vibrate(VIBRATE.weekComplete)
        } else {
          const crossed = ms.some(m => prev < m.pct && dmgPct >= m.pct)
          if (crossed) { playSound('milestone'); vibrate(VIBRATE.weekComplete) }
        }
      }
      prevDamagedPctRef.current = dmgPct
    }
    setLoading(false)
  }

  function openHint() {
    playSound('modal_open')
    vibrate(VIBRATE.light)
    setShowHint(true)
  }

  function closeHint() {
    playSound('modal_close')
    setShowHint(false)
  }

  const currentLevel = member ? getLevel(member.points || 0) : null

  if (loading) return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fdfaf4', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fdfaf4', padding: '16px 20px 12px', borderBottom: '0.5px solid #f0e8d0' }}>
        <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 6 }}>W/NA PTCG × HUGO COLLECTIONS</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fa-solid fa-shield" style={{ fontSize: 13, color: '#BA7517' }} aria-hidden="true"></i>
          共同挑戰
        </div>
      </div>
      <SkeletonPanel height={260} padding="0" radius={0} />
      <SkeletonList count={5} padding="16px" />
      <BottomNav />
    </div>
  )

  if (!boss) return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#fdfaf4', padding: '18px 20px 16px', borderBottom: '0.5px solid #f0e8d0' }}>
        <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="fa-solid fa-shield" style={{ fontSize: 13, color: '#BA7517' }} aria-hidden="true"></i>
          共同挑戰
          <button onClick={openHint} className="press-fx" style={{ marginLeft: 4, width: 18, height: 18, borderRadius: '50%', background: '#F5E8C8', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <i className="fa-solid fa-question" style={{ fontSize: 8, color: '#BA7517' }}></i>
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
        <i className="fa-solid fa-shield" style={{ fontSize: 40, color: '#f0e8d0' }}></i>
        <div style={{ fontSize: 14, color: '#bbb' }}>本月尚未設定挑戰</div>
        <div style={{ fontSize: 12, color: '#ddd' }}>敬請期待下一波 Boss 挑戰</div>
      </div>
      <BottomNav />
      {showHint && <ChallengeHintSheet onClose={closeHint} />}
    </div>
  )

  const damagedPct = Math.min(Math.round((boss.current_amount / boss.target_amount) * 100), 100)
  const remainingPct = 100 - damagedPct
  const damaged = boss.current_amount || 0
  const remaining = Math.max(boss.target_amount - damaged, 0)

  const memberMap = {}
  purchases.forEach(p => {
    const id = p.members?.display_name || '未知'
    if (!memberMap[id]) memberMap[id] = { name: id, level: p.members?.level, avatar_url: p.members?.avatar_url, amount: 0 }
    memberMap[id].amount += p.amount
  })
  const rankList = Object.values(memberMap).sort((a, b) => b.amount - a.amount)
  const totalAmount = rankList.reduce((s, m) => s + m.amount, 0)
  const myEntry = rankList.find(m => m.name === member?.display_name)
  const myRank = myEntry ? rankList.indexOf(myEntry) + 1 : 0
  const myAmount = myEntry?.amount || 0
  const myPct = totalAmount > 0 ? Math.round(myAmount / totalAmount * 100) : 0
  const milestones = parseMilestones(boss)
  const nextMilestone = milestones.find(m => m.pct > damagedPct)
  const myNextGap = nextMilestone && totalAmount > 0
    ? Math.max(0, Math.round((nextMilestone.pct / 100 * boss.target_amount - damaged) * (myAmount / totalAmount)))
    : 0

  const RANK_COLORS = [
    { border: '#BA7517', num: '#854F0B', badge: { bg: '#FAEEDA', border: '#FAC775', text: '#633806' } },
    { border: '#888780', num: '#444441', badge: { bg: '#F1EFE8', border: '#D3D1C7', text: '#444441' } },
    { border: '#c0601a', num: '#854F0B', badge: { bg: '#FAECE7', border: '#F5C4B3', text: '#712B13' } },
  ]

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fdfaf4', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#fdfaf4', padding: '16px 20px 12px', borderBottom: '0.5px solid #f0e8d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -6, left: -6, fontSize: 72, opacity: 0.04, color: '#BA7517', lineHeight: 1, pointerEvents: 'none' }}>
          <i className="fa-solid fa-shield" aria-hidden="true"></i>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 6 }}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="fa-solid fa-shield" style={{ fontSize: 13, color: '#BA7517' }} aria-hidden="true"></i>
            共同挑戰
            <button onClick={openHint} className="press-fx" style={{ marginLeft: 4, width: 18, height: 18, borderRadius: '50%', background: '#F5E8C8', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
              <i className="fa-solid fa-question" style={{ fontSize: 8, color: '#BA7517' }}></i>
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>本月挑戰 · {rankList.length} 人參與</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {member && <PokeballIcon level={currentLevel} size={24} />}
          <span style={{ fontSize: 6, color: '#BA7517', fontWeight: 600 }}>{currentLevel}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>

        {/* Boss 戰場 */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: 280, background: '#1c1208', position: 'relative', overflow: 'hidden' }}>
            {boss.image_url ? (
              <img
                src={boss.image_url}
                alt={boss.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
              />
            ) : null}
            <div style={{ width: '100%', height: '100%', display: boss.image_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1208' }}>
              <i className="fa-solid fa-skull" style={{ fontSize: 72, color: 'rgba(192,96,26,0.25)' }}></i>
            </div>

            {/* Overlay — Boss 名稱 + HP */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 16px 24px', background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 65%, transparent 100%)' }}>

              {/* Boss 名稱 */}
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#f5e8c8', letterSpacing: '0.02em' }}>{boss.name}</span>
              </div>

              {/* HP 血條 */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="fa-solid fa-heart" style={{ fontSize: 10, color: '#E24B4A' }}></i>
                    <span style={{ fontSize: 10, color: 'rgba(245,232,200,0.8)', letterSpacing: '0.06em', fontWeight: 500 }}>HP</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(245,232,200,0.95)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    <HpPctCounter targetPct={remainingPct} delay={300} />%
                  </span>
                </div>
                <BossHpBar targetPct={remainingPct} delay={300} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: 'rgba(245,232,200,0.85)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                    {remaining.toLocaleString()} / {boss.target_amount?.toLocaleString()}
                  </span>
                  {damaged > 0 && (
                    <span style={{ fontSize: 11, color: 'rgba(226,75,74,0.9)', fontWeight: 500 }}>
                      -{damaged.toLocaleString()} 傷害
                    </span>
                  )}
                </div>
              </div>

              {/* Boss 台詞 */}
              {boss.description && (
                <div style={{ fontSize: 11, color: 'rgba(245,232,200,0.75)', fontWeight: 500, marginTop: 6 }}>
                  「{boss.description}」
                </div>
              )}
            </div>
          </div>

          {/* 傷害資訊列 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#f0e8d0' }}>
            <div style={{ background: '#fff', padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>累積傷害</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#A32D2D' }}>{damaged.toLocaleString()}</div>
            </div>
            <div style={{ background: '#fff', padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>Boss 剩餘 HP</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#111' }}>{remaining.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* 里程碑 */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <i className="fa-solid fa-gift" style={{ fontSize: 13, color: '#BA7517' }}></i>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>討伐里程碑</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {milestones.map((m, i) => {
              const unlocked = damagedPct >= m.pct
              const active = !unlocked && (i === 0 || damagedPct >= milestones[i - 1].pct)
              const iconName = unlocked ? 'fa-check' : active ? MILESTONE_ICONS[i] : (m.pct === 100 ? 'fa-trophy' : 'fa-lock')
              return (
                <div key={i} style={{
                  borderRadius: 10, padding: '10px 4px 8px', textAlign: 'center',
                  background: unlocked ? '#fdfaf4' : active ? '#fff' : '#f8f5f0',
                  border: unlocked ? '0.5px solid #FAC775' : active ? '1.5px solid #E24B4A' : '0.5px solid #e8dfc8',
                  position: 'relative',
                }}>
                  {active && (
                    <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', background: '#E24B4A', borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 8, color: '#fff', fontWeight: 500 }}>進行中</span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 500, color: unlocked ? '#854F0B' : active ? '#A32D2D' : '#B4B2A9', marginBottom: 6, marginTop: active ? 4 : 0 }}>
                    {m.pct}%
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 8, margin: '0 auto 6px', background: unlocked ? '#FAEEDA' : active ? '#FCEBEB' : '#f0ede8', border: `0.5px solid ${unlocked ? '#FAC775' : active ? '#F09595' : '#e0dcd4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fa-solid ${iconName}`} style={{ fontSize: 14, color: unlocked ? '#BA7517' : active ? '#E24B4A' : '#C4BFB8' }}></i>
                  </div>
                  <div style={{ fontSize: 9, color: unlocked ? '#854F0B' : active ? '#A32D2D' : '#B4B2A9', fontWeight: active || unlocked ? 500 : 400 }}>
                    {unlocked ? '已解鎖' : active ? '攻略中' : m.pct === 100 ? '最終獎' : '未解鎖'}
                  </div>
                  {(unlocked || active) && m.reward && (
                    <div style={{ fontSize: 8, color: unlocked ? '#633806' : '#A32D2D', marginTop: 3, padding: '0 2px', lineHeight: 1.3 }}>{m.reward}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 最新戰報 */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-bolt" style={{ fontSize: 13, color: '#BA7517' }}></i>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>最新戰報</span>
            </div>
            <span style={{ fontSize: 10, color: '#bbb' }}>最近 5 筆</span>
          </div>
          <div style={{ background: '#fff', border: '0.5px solid #f0e8d0', borderRadius: 12, overflow: 'hidden' }}>
            {recentPurchases.length > 0 ? recentPurchases.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < recentPurchases.length - 1 ? '0.5px solid #f5f0e8' : 'none' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#633806', flexShrink: 0, border: '0.5px solid #FAC775' }}>
                  {(p.members?.display_name || '?')[0]}
                </div>
                <div style={{ flex: 1, fontSize: 12 }}>
                  <span style={{ fontWeight: 500, color: '#111' }}>{p.members?.display_name || '訓練家'}</span>
                  <span style={{ color: '#999' }}> 對 Boss 造成 </span>
                  <span style={{ fontWeight: 500, color: '#A32D2D' }}>{p.amount?.toLocaleString()} 傷害</span>
                </div>
                <span style={{ fontSize: 10, color: '#ccc', flexShrink: 0 }}>{relativeTime(p.created_at)}</span>
              </div>
            )) : (
              <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                <i className="fa-solid fa-shield" style={{ fontSize: 28, color: '#f0e8d0', display: 'block', marginBottom: 8 }}></i>
                <div style={{ fontSize: 13, color: '#bbb', marginBottom: 4 }}>尚未有人發起挑戰</div>
                <div style={{ fontSize: 11, color: '#ddd' }}>成為第一位造成傷害的訓練家</div>
              </div>
            )}
          </div>
        </div>

        {/* 本月戰況 */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <i className="fa-solid fa-chart-bar" style={{ fontSize: 13, color: '#BA7517' }}></i>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>本月戰況</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: '參與訓練家', value: `${rankList.length} 人`, color: '#111' },
              { label: '累積傷害', value: damaged.toLocaleString(), color: '#A32D2D' },
              { label: 'Boss 剩餘', value: remaining.toLocaleString(), color: '#111' },
              { label: '預估完成率', value: `${Math.min(damagedPct, 100)}%`, color: '#854F0B' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', border: '0.5px solid #f0e8d0', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 排行榜 */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <i className="fa-solid fa-ranking-star" style={{ fontSize: 13, color: '#BA7517' }}></i>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>本月貢獻排行</span>
          </div>
          <div style={{ background: '#fff', border: '0.5px solid #f0e8d0', borderRadius: 12, overflow: 'hidden' }}>
            {rankList.length > 0 ? rankList.map((m, i) => {
              const rc = RANK_COLORS[i] || null
              const pct = totalAmount > 0 ? Math.round(m.amount / totalAmount * 100) : 0
              return (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < rankList.length - 1 ? '0.5px solid #f5f0e8' : 'none', borderLeft: rc ? `3px solid ${rc.border}` : '3px solid transparent', borderRadius: 0 }}>
                  <span style={{ fontSize: rc ? 14 : 12, fontWeight: rc ? 500 : 400, color: rc ? rc.num : '#bbb', width: 18, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid #FAC775', flexShrink: 0 }} />
                    : <div style={{ width: 30, height: 30, borderRadius: '50%', background: rc ? '#FAEEDA' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: rc ? '#633806' : '#aaa', border: `0.5px solid ${rc ? '#FAC775' : '#eee'}`, flexShrink: 0 }}>
                        {m.name[0]}
                      </div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: rc ? rc.num : '#bbb', marginTop: 1 }}>傷害 {m.amount.toLocaleString()}</div>
                  </div>
                  {rc ? (
                    <div style={{ background: rc.badge.bg, border: `0.5px solid ${rc.badge.border}`, borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: rc.badge.text, fontWeight: 500 }}>{pct}%</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 10, color: '#bbb', flexShrink: 0 }}>{pct}%</span>
                  )}
                </div>
              )
            }) : (
              <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                <i className="fa-solid fa-ranking-star" style={{ fontSize: 28, color: '#f0e8d0', display: 'block', marginBottom: 8 }}></i>
                <div style={{ fontSize: 13, color: '#bbb', marginBottom: 4 }}>尚未有人上榜</div>
                <div style={{ fontSize: 11, color: '#ddd' }}>成為本月第一位挑戰者</div>
              </div>
            )}
          </div>
        </div>

        {/* 我的貢獻 */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ background: '#fff', border: '0.5px solid #f0e8d0', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-user" style={{ fontSize: 13, color: '#BA7517' }}></i>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>我的貢獻</span>
              </div>
              {myRank > 0 && (
                <span style={{ fontSize: 11, background: '#E6F1FB', color: '#0C447C', padding: '2px 8px', borderRadius: 20, border: '0.5px solid #B5D4F4' }}>第 {myRank} 名</span>
              )}
            </div>
            {myAmount > 0 ? (
              <>
                <AnimatedBar targetPct={myPct} color="#378ADD" height={7} delay={600} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginTop: 6 }}>
                  <span>本月傷害 {myAmount.toLocaleString()} · 佔比 {myPct}%</span>
                  {myNextGap > 0 && <span>距下一獎勵 {myNextGap.toLocaleString()}</span>}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 12, color: '#bbb', marginBottom: 4 }}>本月尚未貢獻傷害</div>
                <div style={{ fontSize: 11, color: '#ddd' }}>前往商城消費即可參與挑戰</div>
              </div>
            )}
          </div>
        </div>

      </div>

      <BottomNav />
      {showHint && <ChallengeHintSheet onClose={closeHint} />}
    </div>
  )
}
