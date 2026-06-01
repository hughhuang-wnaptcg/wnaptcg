import React, { useEffect, useState } from 'react'
import { supabase, RARITY_COLORS } from '../lib/supabase'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'

export default function LeaderboardSheet({ onClose, currentMemberId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // 點進去的會員
  const [showcaseCards, setShowcaseCards] = useState([])
  const [showcaseLoading, setShowcaseLoading] = useState(false)

  useEffect(() => { fetchLeaderboard() }, [])

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('members')
      .select('id, display_name, level, points, avatar_url, member_no, showcase_cards, created_at')
      .eq('is_hidden', false)
      .order('points', { ascending: false })
      .limit(50)
    setMembers(data || [])
    setLoading(false)
  }

  async function openProfile(member) {
    setSelected(member)
    setShowcaseCards([])
    if (!member.showcase_cards?.length) return
    setShowcaseLoading(true)
    const { data } = await supabase
      .from('card_owners')
      .select('id, cards(id, name, rarity, series, image_url)')
      .in('id', member.showcase_cards)
    // 保持順序
    const ordered = member.showcase_cards.map(coid => data?.find(d => d.id === coid) || null)
    setShowcaseCards(ordered)
    setShowcaseLoading(false)
  }

  const medalColor = (i) => {
    if (i === 0) return { bg: 'linear-gradient(135deg,#FFD700,#FFA500)', color: '#7A4A00' }
    if (i === 1) return { bg: 'linear-gradient(135deg,#C0C0C0,#A0A0A0)', color: '#444' }
    if (i === 2) return { bg: 'linear-gradient(135deg,#CD7F32,#A0522D)', color: '#fff' }
    return { bg: '#f5f0e8', color: '#999' }
  }

  return (
    <>
      {/* 排行榜 Sheet */}
      <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
      <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="fa-solid fa-ranking-star" style={{ fontSize: 14, color: '#E07B00' }}></i>
          積分排行榜
        </div>
        <span onClick={onClose} style={{ fontSize: 20, color: '#ccc', cursor: 'pointer', lineHeight: 1 }}>✕</span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 14 }}>載入中...</div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 14 }}>尚無資料</div>
        ) : members.map((m, i) => {
          const medal = medalColor(i)
          const isMe = m.id === currentMemberId
          return (
            <div
              key={m.id}
              onClick={() => openProfile(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 20px',
                background: isMe ? 'linear-gradient(135deg,#FFF8EE,#FFFBF2)' : '#fff',
                borderBottom: '0.5px solid #f5f0e8',
                cursor: 'pointer',
                borderLeft: isMe ? '3px solid #E07B00' : '3px solid transparent',
              }}>
              {/* 名次 */}
              <div style={{ width: 28, height: 28, borderRadius: 8, background: medal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: i < 3 ? 12 : 11, fontWeight: 700, color: medal.color }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </span>
              </div>

              {/* 頭像 */}
              {m.avatar_url
                ? <img src={m.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775', flexShrink: 0 }} />
                : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#633806', border: '1.5px solid #FAC775', flexShrink: 0 }}>
                    {m.display_name?.[0]?.toUpperCase()}
                  </div>
              }

              {/* 名稱 & 等級 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2D1A00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.display_name}</span>
                  {isMe && <span style={{ fontSize: 9, background: '#FFF3E0', color: '#E07B00', padding: '1px 6px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>我</span>}
                </div>
                <LevelBadge level={m.level} size='sm' />
              </div>

              {/* 積分 */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#E07B00' }}>{m.points?.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: '#bbb' }}>積分</div>
              </div>

              <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: '#ddd', flexShrink: 0 }}></i>
            </div>
          )
        })}
      </div>

      {/* 會員主頁 Sheet（疊在排行榜上） */}
      {selected && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
          <div style={{ padding: '12px 20px 10px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid #f0e8d0', background: '#f8f5f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-arrow-left" style={{ fontSize: 11, color: '#888' }}></i>
            </button>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2D1A00' }}>會員主頁</div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 32px' }}>
            {/* 會員資訊 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'linear-gradient(135deg,#FFFBF2,#FFF5DC)', borderRadius: 16, border: '0.5px solid #F5E8C8', marginBottom: 20 }}>
              {selected.avatar_url
                ? <img src={selected.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #FAC775', flexShrink: 0 }} />
                : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#633806', border: '2px solid #FAC775', flexShrink: 0 }}>
                    {selected.display_name?.[0]?.toUpperCase()}
                  </div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#2D1A00', marginBottom: 5 }}>{selected.display_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <LevelBadge level={selected.level} size='md' />
                  <span style={{ fontSize: 11, color: '#bbb' }}>#{String(selected.member_no || '0').padStart(4, '0')}</span>
                </div>
                <div style={{ fontSize: 10, color: '#bbb', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <i className="fa-regular fa-clock" style={{ fontSize: 9 }}></i>
                  加入於 {new Date(selected.created_at).toLocaleDateString('zh-TW')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#E07B00' }}>{selected.points?.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: '#bbb' }}>積分</div>
              </div>
            </div>

            {/* 展示卡 */}
            <div style={{ fontSize: 14, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ width: 26, height: 26, borderRadius: 10, background: 'linear-gradient(135deg,#BA7517,#EF9F27)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>
                <i className="fa-solid fa-id-card"></i>
              </span>
              展示卡
            </div>

            {showcaseLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13 }}>載入中...</div>
            ) : !selected.showcase_cards?.length ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#ccc', fontSize: 13 }}>
                <i className="fa-solid fa-id-card" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.3 }}></i>
                尚未設置展示卡
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[0,1,2].map(i => {
                  const slot = showcaseCards[i]
                  const rc = slot?.cards ? (RARITY_COLORS[slot.cards.rarity] || RARITY_COLORS.Other) : null
                  return (
                    <div key={i}>
                      <div style={{ aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', background: slot ? '#fff' : '#f5f0e8', border: slot ? 'none' : '2px dashed #F5E8C8', boxShadow: slot ? '0 4px 14px rgba(186,117,23,.12)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {slot?.cards?.image_url
                          ? <img src={slot.cards.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : slot
                            ? <i className="fa-solid fa-id-card" style={{ fontSize: 28, color: '#D4A94A', opacity: 0.4 }}></i>
                            : <i className="fa-solid fa-minus" style={{ fontSize: 14, color: '#D4A94A', opacity: 0.3 }}></i>
                        }
                        {slot?.cards && rc && (
                          <span style={{ position: 'absolute', top: 5, left: 5, fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 20, background: rc.bg, color: rc.color }}>{slot.cards.rarity}</span>
                        )}
                      </div>
                      {slot?.cards && (
                        <div style={{ marginTop: 5 }}>
                          <div style={{ fontSize: 9, color: '#7a5c2e', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.cards.name}</div>
                          <div style={{ fontSize: 8, color: '#bbb', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.cards.series}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
