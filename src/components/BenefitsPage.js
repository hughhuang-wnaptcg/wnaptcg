import React, { useEffect, useState } from 'react'
import { supabase, LEVELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'

const LEVEL_COLORS = ['#888780','#378ADD','#E24B4A','#BA7517','#854F0B','#534AB7','#26215C']
const LEVEL_BG    = ['#F1EFE8','#E6F1FB','#FCEBEB','#FAEEDA','#EAF3DE','#EEEDFE','rgba(38,33,92,0.08)']

/**
 * BenefitsPage — 會員福利頁
 * 用法：在 ProfilePage 裡用 modal/sheet 呼叫，或作為獨立頁面
 * Props: onClose (若作為 sheet 使用)
 */
export default function BenefitsPage({ onClose }) {
  const { member } = useAuth()
  const [benefits, setBenefits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchBenefits() }, [])

  async function fetchBenefits() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'benefits').single()
    if (data) {
      try { setBenefits(JSON.parse(data.value)) } catch(e) {}
    }
    setLoading(false)
  }

  const myLevelIdx = LEVELS.findIndex(l => l.name === member?.level)

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .benefit-item { transition: background 0.15s; }
        .benefit-item:hover { background: rgba(186,117,23,0.04) !important; }
      `}</style>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.glow} />
        <div style={{ position:'absolute', bottom:-6, left:-6, fontSize:72, opacity:0.05, color:'#BA7517', lineHeight:1, pointerEvents:'none' }}>
          <i className="fa-solid fa-gift" aria-hidden="true"></i>
        </div>
        {[[10,20],[25,62],[8,42],[18,80]].map(([t,l],i)=>(
          <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width:2, height:2, borderRadius:'50%', background:'#BA7517', opacity:0.3+i*0.1 }}/>
        ))}

        {/* 關閉按鈕（若作為 sheet） */}
        {onClose && (
          <button onClick={onClose} style={{ position:'absolute', top:14, right:14, width:28, height:28, borderRadius:'50%', background:'rgba(186,117,23,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="fa-solid fa-xmark" style={{ fontSize:13, color:'#BA7517' }}></i>
          </button>
        )}

        <div style={{ fontSize:9, color:'#BA7517', fontWeight:600, opacity:0.55, letterSpacing:'0.1em', marginBottom:8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
        <div style={{ fontSize:15, fontWeight:500, color:'#1a1a1a', display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
          <i className="fa-solid fa-gift" style={{ fontSize:13, color:'#BA7517' }}></i>
          會員等級福利
        </div>
        <div style={{ fontSize:11, color:'#bbb' }}>升級解鎖更多專屬優惠</div>

        {/* 我的等級 badge */}
        {member && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, background:'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border:'0.5px solid #FAC775', borderRadius:20, padding:'4px 12px' }}>
            <PokeballIcon level={member.level} size={14} />
            <span style={{ fontSize:11, color:'#8B5A00', fontWeight:500 }}>目前等級：{member.level}</span>
          </div>
        )}
      </div>

      {/* 內容 */}
      <div style={{ padding:'16px 20px 32px', flex:1, overflowY:'auto' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#bbb', fontSize:14 }}>載入中...</div>
        ) : benefits.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#bbb', fontSize:14 }}>
            <i className="fa-solid fa-gift" style={{ fontSize:32, marginBottom:10, display:'block', opacity:0.3 }}></i>
            福利內容即將公布
          </div>
        ) : (
          benefits.map((b, i) => {
            const isCurrent = b.level === member?.level
            const isUnlocked = myLevelIdx >= i
            const color = LEVEL_COLORS[i]
            const bg = LEVEL_BG[i]

            return (
              <div key={b.level} style={{ ...S.card, borderColor: isCurrent ? color : '#f0e8d0', animation:`fadeUp 0.4s ${i*0.06}s ease both`, opacity: isUnlocked ? 1 : 0.5 }}>
                {/* 等級標頭 */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: b.items.length > 0 ? 12 : 0 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:bg, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <PokeballIcon level={b.level} size={20} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: isCurrent ? color : '#111' }}>{b.level}</div>
                    <div style={{ fontSize:10, color:'#bbb', marginTop:1 }}>
                      {i === 0 ? '初始會員' : `${LEVELS[i].min.toLocaleString()} 點以上`}
                    </div>
                  </div>
                  {isCurrent && (
                    <span style={{ fontSize:10, background:`${color}15`, color, padding:'3px 9px', borderRadius:20, border:`0.5px solid ${color}40`, fontWeight:500 }}>
                      目前等級
                    </span>
                  )}
                  {!isUnlocked && (
                    <i className="fa-solid fa-lock" style={{ fontSize:12, color:'#ccc' }}></i>
                  )}
                  {isUnlocked && !isCurrent && (
                    <i className="fa-solid fa-check" style={{ fontSize:12, color }}></i>
                  )}
                </div>

                {/* 福利項目 */}
                {b.items.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {b.items.map((item, j) => (
                      <div key={j} className="benefit-item" style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 0', borderTop: j > 0 ? '0.5px solid #f5f0e8' : `0.5px solid #f5f0e8` }}>
                        <div style={{ width:18, height:18, borderRadius:5, background:isUnlocked ? `${color}15` : '#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                          <i className="fa-solid fa-check" style={{ fontSize:9, color: isUnlocked ? color : '#ccc' }}></i>
                        </div>
                        <div style={{ fontSize:13, color: isUnlocked ? '#333' : '#bbb', lineHeight:1.5, flex:1 }}>{item}</div>
                      </div>
                    ))}
                  </div>
                )}

                {b.items.length === 0 && (
                  <div style={{ fontSize:12, color:'#ddd', paddingTop:8, borderTop:'0.5px solid #f5f0e8' }}>
                    即將公布
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* 升級提示 */}
        {member && myLevelIdx < LEVELS.length - 1 && (
          <div style={{ marginTop:8, padding:'12px 14px', background:'linear-gradient(135deg,#FAEEDA,#FFF8EE)', border:'0.5px solid #FAC775', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
            <i className="fa-solid fa-arrow-up" style={{ fontSize:14, color:'#BA7517' }}></i>
            <div>
              <div style={{ fontSize:12, color:'#8B5A00', fontWeight:500 }}>繼續累積積分</div>
              <div style={{ fontSize:11, color:'#BA7517', marginTop:1 }}>
                距離 {LEVELS[myLevelIdx + 1].name} 還差 {(LEVELS[myLevelIdx + 1].min - member.points).toLocaleString()} 點
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const S = {
  page: { maxWidth:390, margin:'0 auto', background:'#fff', minHeight:'100%', display:'flex', flexDirection:'column' },
  hero: { background:'linear-gradient(135deg,#fff 0%,#fdfaf4 60%,#faf4e8 100%)', padding:'18px 20px 16px', position:'relative', overflow:'hidden', borderBottom:'0.5px solid #f0e8d0', flexShrink:0 },
  glow: { position:'absolute', top:-40, right:-40, width:130, height:130, borderRadius:'50%', background:'radial-gradient(circle,rgba(186,117,23,0.07) 0%,transparent 70%)' },
  card: { border:'0.5px solid #f0e8d0', borderRadius:12, padding:'12px 14px', marginBottom:10, background:'#fff', boxShadow:'0 1px 6px rgba(186,117,23,0.04)' },
}
