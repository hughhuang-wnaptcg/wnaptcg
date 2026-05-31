import React, { useEffect, useState } from 'react'
import { supabase, LEVELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon } from '../lib/pokeballs'

const LEVEL_COLORS = ['#888780','#378ADD','#E24B4A','#BA7517','#854F0B','#534AB7','#26215C']
const LEVEL_BG    = ['#F1EFE8','#E6F1FB','#FCEBEB','#FAEEDA','#EAF3DE','#EEEDFE','rgba(38,33,92,0.08)']

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
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* 精簡 Header */}
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={S.headerIcon}>
            <i className="fa-solid fa-gift" style={{ fontSize:14, color:'#BA7517' }}></i>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:500, color:'#1a1a1a' }}>會員等級福利</div>
            <div style={{ fontSize:10, color:'#bbb', marginTop:1 }}>升級解鎖更多專屬優惠</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* 我的等級 badge */}
          {member && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border:'0.5px solid #FAC775', borderRadius:20, padding:'3px 10px' }}>
              <PokeballIcon level={member.level} size={12} />
              <span style={{ fontSize:10, color:'#8B5A00', fontWeight:500 }}>{member.level}</span>
            </div>
          )}
          {onClose && (
            <button onClick={onClose} style={{ width:26, height:26, borderRadius:'50%', background:'#f5f0e8', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="fa-solid fa-xmark" style={{ fontSize:12, color:'#BA7517' }}></i>
            </button>
          )}
        </div>
      </div>

      {/* 內容 */}
      <div style={S.content}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#bbb', fontSize:13 }}>載入中...</div>
        ) : benefits.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#bbb', fontSize:13 }}>
            <i className="fa-solid fa-gift" style={{ fontSize:28, marginBottom:10, display:'block', opacity:0.25 }}></i>
            福利內容即將公布
          </div>
        ) : (
          <>
            {benefits.map((b, i) => {
              const isCurrent = b.level === member?.level
              const isUnlocked = myLevelIdx >= i
              const color = LEVEL_COLORS[i]
              const bg = LEVEL_BG[i]

              return (
                <div key={b.level} style={{
                  ...S.card,
                  borderColor: isCurrent ? color : '#f0e8d0',
                  opacity: isUnlocked ? 1 : 0.45,
                  animation: `fadeUp 0.35s ${i * 0.05}s ease both`,
                  background: isCurrent ? `linear-gradient(135deg, ${bg}, #fff)` : '#fff',
                }}>
                  {/* 等級標頭 */}
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:bg, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <PokeballIcon level={b.level} size={18} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color: isCurrent ? color : '#111', lineHeight:1.3 }}>{b.level}</div>
                      <div style={{ fontSize:10, color:'#bbb' }}>
                        {i === 0 ? '初始會員' : `${LEVELS[i].min.toLocaleString()} 點以上`}
                      </div>
                    </div>
                    {isCurrent && (
                      <span style={{ fontSize:9, background:`${color}18`, color, padding:'2px 8px', borderRadius:20, border:`0.5px solid ${color}35`, fontWeight:600 }}>
                        目前
                      </span>
                    )}
                    {!isUnlocked && <i className="fa-solid fa-lock" style={{ fontSize:11, color:'#ddd' }}></i>}
                    {isUnlocked && !isCurrent && <i className="fa-solid fa-check" style={{ fontSize:11, color }}></i>}
                  </div>

                  {/* 福利項目 */}
                  {b.items.length > 0 && (
                    <div style={{ marginTop:10, paddingTop:10, borderTop:`0.5px solid ${isCurrent ? color+'20' : '#f5f0e8'}` }}>
                      {b.items.map((item, j) => (
                        <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'4px 0' }}>
                          <div style={{ width:16, height:16, borderRadius:4, background: isUnlocked ? `${color}18` : '#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                            <i className="fa-solid fa-check" style={{ fontSize:8, color: isUnlocked ? color : '#ddd' }}></i>
                          </div>
                          <div style={{ fontSize:12, color: isUnlocked ? '#444' : '#ccc', lineHeight:1.5, flex:1 }}>{item}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {b.items.length === 0 && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop:'0.5px solid #f5f0e8', fontSize:11, color:'#ddd' }}>即將公布</div>
                  )}
                </div>
              )
            })}

            {/* 升級提示 */}
            {member && myLevelIdx < LEVELS.length - 1 && (
              <div style={{ marginTop:4, marginBottom:8, padding:'11px 14px', background:'linear-gradient(135deg,#FAEEDA,#FFF8EE)', border:'0.5px solid #FAC775', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
                <i className="fa-solid fa-arrow-trend-up" style={{ fontSize:14, color:'#BA7517' }}></i>
                <div>
                  <div style={{ fontSize:11, color:'#8B5A00', fontWeight:500 }}>繼續累積積分</div>
                  <div style={{ fontSize:10, color:'#BA7517', marginTop:1 }}>
                    距離 {LEVELS[myLevelIdx + 1]?.name} 還差 {(LEVELS[myLevelIdx + 1]?.min - member.points).toLocaleString()} 點
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const S = {
  page: {
    display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px 10px', borderBottom: '0.5px solid #f0e8d0',
    flexShrink: 0, background: '#fff',
  },
  headerIcon: {
    width: 34, height: 34, borderRadius: 9,
    background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)',
    border: '0.5px solid rgba(186,117,23,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  content: {
    flex: 1, overflowY: 'auto', padding: '12px 16px 24px',
  },
  card: {
    border: '0.5px solid #f0e8d0', borderRadius: 12,
    padding: '11px 12px', marginBottom: 8,
    boxShadow: '0 1px 4px rgba(186,117,23,0.04)',
  },
}
