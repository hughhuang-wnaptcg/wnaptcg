import React, { useEffect, useState, useMemo } from 'react'
import { supabase, RARITY_COLORS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { LevelBadge, PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'

const RARITIES = ['UR','HR','SAR','CSR','SSR','SR','AR','CHR','PROMO','Other']

const SNKR_LOGO = 'data:image/avif;base64,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'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}

export default function WallPage() {
  const { member } = useAuth()
  const [cards, setCards] = useState([])
  const [myCards, setMyCards] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('')

  useEffect(() => { fetchCards() }, [member])

  async function fetchCards() {
    const { data: allData } = await supabase.from('cards')
      .select('*, card_owners(member_id, created_at, members(display_name, level, avatar_url))')
      .order('created_at', { ascending: false })
    setCards(allData || [])
    if (member) {
      const { data: myData } = await supabase.from('cards')
        .select('*, card_owners!inner(member_id, created_at, members(display_name, level, avatar_url))')
        .eq('card_owners.member_id', member.id)
        .order('created_at', { ascending: false })
      setMyCards(myData || [])
    }
    setLoading(false)
  }

  const baseCards = tab === 'my' ? myCards : cards

  const displayCards = useMemo(() => {
    if (!rarityFilter) return baseCards
    return baseCards.filter(c => c.rarity === rarityFilter)
  }, [baseCards, rarityFilter])

  const rarityCount = useMemo(() => {
    const counts = {}
    baseCards.forEach(c => { counts[c.rarity] = (counts[c.rarity] || 0) + 1 })
    return counts
  }, [baseCards])

  const availableRarities = RARITIES.filter(r => rarityCount[r] > 0)

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#FFFBF2', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    hero: { background: 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)', padding: '18px 20px 16px', position: 'relative', overflow: 'hidden', borderBottom: 'none' },
    tabBar: { display: 'flex', borderBottom: '0.5px solid #f0e8d0', background: '#FFFBF2' },
    tabBtn: (active) => ({ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: active ? 500 : 400, color: active ? '#E07B00' : '#bbb', textAlign: 'center', cursor: 'pointer', background: 'none', border: 'none', borderBottom: active ? '2px solid #E07B00' : '2px solid transparent' }),
  }

  return (
    <div style={S.page}>

      {/* Hero */}
      <div style={S.hero}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.07) 0%,transparent 70%)' }} />
        <svg style={{ position: 'absolute', right: -16, bottom: -22, width: 100, height: 100, opacity: 0.07, pointerEvents: 'none' }} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="47" stroke="#BA7517" strokeWidth="4"/>
          <path d="M3 50 Q27 37 50 50 Q73 63 97 50" stroke="#BA7517" strokeWidth="4" fill="none"/>
          <circle cx="50" cy="50" r="12" fill="none" stroke="#BA7517" strokeWidth="4"/>
          <circle cx="50" cy="50" r="6" fill="#BA7517"/>
        </svg>
        {[[10,20],[25,62],[8,42]].map(([t,l],i) => (
          <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width:2, height:2, borderRadius:'50%', background:'#BA7517', opacity:0.4+i*0.1 }} />
        ))}
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {member && (
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #FAC775', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
              <PokeballIcon level={member.level} size={26} />
            </div>
          )}
          <span style={{ fontSize: 6, color: '#BA7517', fontWeight: 600 }}>{member?.level}</span>
        </div>
        <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <i className="fa-solid fa-trophy" style={{ fontSize: 13, color: '#E07B00' }}></i>
          戰績牆
        </div>
        <div style={{ fontSize: 11, color: '#bbb' }}>
          {tab === 'all'
            ? `歷史開箱高光時刻 · 共 ${rarityFilter ? `${displayCards.length}/` : ''}${cards.length} 張`
            : `我的開箱紀錄 · 共 ${rarityFilter ? `${displayCards.length}/` : ''}${myCards.length} 張`}
        </div>
      </div>

      {/* Tab 切換 */}
      <div style={S.tabBar}>
        <button style={S.tabBtn(tab === 'all')} onClick={() => { setTab('all'); setRarityFilter('') }}>
          <i className="fa-solid fa-globe" style={{ marginRight: 5, fontSize: 12 }}></i>全部紀錄
        </button>
        <button style={S.tabBtn(tab === 'my')} onClick={() => { setTab('my'); setRarityFilter('') }}>
          <i className="fa-solid fa-user" style={{ marginRight: 5, fontSize: 12 }}></i>我的戰績
        </button>
      </div>

      {/* 稀有度篩選列 */}
      {!loading && availableRarities.length > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #f5f0e8', overflowX: 'auto', display: 'flex', gap: 6, background: '#fff' }}>
          <button
            onClick={() => setRarityFilter('')}
            style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${!rarityFilter ? '#FAC775' : '#f0e8d0'}`, background: !rarityFilter ? 'linear-gradient(135deg,#FAEEDA,#FFF3D0)' : '#f8f5f0', color: !rarityFilter ? '#8B5A00' : '#999' }}>
            全部
          </button>
          {availableRarities.map(r => {
            const rc = RARITY_COLORS[r] || RARITY_COLORS.Other
            const active = rarityFilter === r
            return (
              <button
                key={r}
                onClick={() => setRarityFilter(active ? '' : r)}
                style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? rc.color : '#f0e8d0'}`, background: active ? rc.bg : '#f8f5f0', color: active ? rc.color : '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                {r}
                <span style={{ fontSize: 9, opacity: 0.7 }}>{rarityCount[r]}</span>
              </button>
            )
          })}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 14 }}>載入中...</div>
        ) : displayCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#bbb' }}>
            <i className="fa-solid fa-id-card" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.3 }}></i>
            <div style={{ fontSize: 14 }}>
              {rarityFilter ? `沒有 ${rarityFilter} 稀有度的卡牌` : tab === 'my' ? '還沒有開箱紀錄' : '暫無卡牌'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, padding: '14px 20px 20px' }}>
            {displayCards.map((card, idx) => {
              const rc = RARITY_COLORS[card.rarity] || RARITY_COLORS.Other
              const owner = card.card_owners?.[0]
              return (
                <div key={card.id} onClick={() => setSelected(card)}
                  style={{ border: 'none', borderRadius: 18, overflow: 'hidden', background: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px rgba(186,117,23,.10)' }}>
                  <div style={{ aspectRatio: '3/4', background: '#f8f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {card.image_url
                      ? <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <i className="fa-solid fa-id-card" style={{ fontSize: 40, color: '#D4A94A', opacity: 0.3 }}></i>}
                    <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: rc.bg, color: rc.color, border: `0.5px solid ${rc.color}33` }}>{card.rarity}</span>
                    {idx === 0 && !rarityFilter && tab === 'all' && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: '#E24B4A', color: '#fff' }}>NEW</span>}
                  </div>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#111', marginBottom: 3 }}>{card.name}</div>
                    <div style={{ fontSize: 10, color: '#BA7517', marginBottom: card.snkr_price ? 5 : 6 }}>{card.series}</div>
                    {card.snkr_price && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, padding: '3px 6px', background: '#F8F8F8', borderRadius: 6, border: '0.5px solid #E8E8E8' }}>
                        <img src={SNKR_LOGO} alt="SNKR" style={{ width: 28, height: 14, objectFit: 'contain', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#1a1a1a' }}>$ {card.snkr_price.toLocaleString()}</span>
                      </div>
                    )}
                    {tab === 'all' && (
                      <div style={{ paddingTop: 5, borderTop: '0.5px solid #f5f0e8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {owner?.members?.avatar_url
                            ? <img src={owner.members.avatar_url} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid #FAC775' }} />
                            : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 600, color: '#633806', border: '0.5px solid #FAC775' }}>
                                {owner?.members?.display_name?.[0]?.toUpperCase() || '?'}
                              </div>
                          }
                          <span style={{ fontSize: 9, color: '#999', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {card.card_owners?.map(o => o.members?.display_name).join(', ') || '-'}
                          </span>
                        </div>
                        {owner?.created_at && (
                          <div style={{ fontSize: 9, color: '#ccc', marginTop: 3 }}>
                            <i className="fa-regular fa-calendar" style={{ marginRight: 3 }}></i>
                            {formatDate(owner.created_at)}
                          </div>
                        )}
                      </div>
                    )}
                    {tab === 'my' && owner?.created_at && (
                      <div style={{ paddingTop: 5, borderTop: '0.5px solid #f5f0e8', fontSize: 9, color: '#ccc' }}>
                        <i className="fa-regular fa-calendar" style={{ marginRight: 3 }}></i>
                        {formatDate(owner.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 卡牌詳情彈窗 */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: 20, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '0 auto 16px' }} />
            <div style={{ width: '100%', aspectRatio: '3/4', maxWidth: 130, margin: '0 auto 14px', borderRadius: 10, background: '#f8f5f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #f0e8d0' }}>
              {selected.image_url
                ? <img src={selected.image_url} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <i className="fa-solid fa-id-card" style={{ fontSize: 48, color: '#D4A94A', opacity: 0.3 }}></i>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: RARITY_COLORS[selected.rarity]?.bg || '#f5f5f5', color: RARITY_COLORS[selected.rarity]?.color || '#666', border: `0.5px solid ${RARITY_COLORS[selected.rarity]?.color || '#ccc'}44` }}>{selected.rarity}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111', textAlign: 'center', marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: '#BA7517', textAlign: 'center', marginBottom: selected.snkr_price ? 12 : 16 }}>{selected.series}</div>
            {selected.snkr_price && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', background: '#F8F8F8', borderRadius: 12, border: '1px solid #E8E8E8', marginBottom: 16 }}>
                <img src={SNKR_LOGO} alt="SNKR" style={{ width: 48, height: 24, objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ width: '0.5px', height: 20, background: '#E0E0E0', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 1 }}>SNKR 成交價</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
                    $ {selected.snkr_price.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>開卡會員</div>
            {selected.card_owners?.map(o => (
              <div key={o.member_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '0.5px solid #f0e8d0', borderRadius: 10, marginBottom: 8, background: 'linear-gradient(135deg,#fdfaf4,#fff)' }}>
                {o.members?.avatar_url
                  ? <img src={o.members.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#633806', border: '1.5px solid #FAC775' }}>
                      {o.members?.display_name?.[0]?.toUpperCase()}
                    </div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 3 }}>{o.members?.display_name}</div>
                  <LevelBadge level={o.members?.level} size='sm' />
                  {o.created_at && (
                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>
                      <i className="fa-regular fa-calendar" style={{ marginRight: 3 }}></i>
                      獲得於 {formatDate(o.created_at)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
