import React, { useEffect, useState } from 'react'
import { supabase, RARITY_COLORS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { LevelBadge, PokeballIcon } from '../lib/pokeballs'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function WallPage() {
  const { member } = useAuth()
  const [cards, setCards] = useState([])
  const [myCards, setMyCards] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => { fetchCards() }, [member])

  async function fetchCards() {
    const { data: allData } = await supabase.from('cards')
      .select('*, card_owners(member_id, members(display_name, level, avatar_url))')
      .order('created_at', { ascending: false })
    setCards(allData || [])

    if (member) {
      const { data: myData } = await supabase.from('cards')
        .select('*, card_owners!inner(member_id, members(display_name, level, avatar_url))')
        .eq('card_owners.member_id', member.id)
        .order('created_at', { ascending: false })
      setMyCards(myData || [])
    }
    setLoading(false)
  }

  const displayCards = tab === 'my' ? myCards : cards

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    hero: { background: 'linear-gradient(135deg,#fff 0%,#fdfaf4 60%,#faf4e8 100%)', padding: '18px 20px 16px', position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid #f0e8d0' },
    glow: { position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle,rgba(186,117,23,0.07) 0%,transparent 70%)' },
    timeBg: { position: 'absolute', bottom: -6, left: -6, fontSize: 72, opacity: 0.05, color: '#BA7517', lineHeight: 1, pointerEvents: 'none' },
    badge: { position: 'absolute', top: 14, right: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
    heroTitle: { fontSize: 15, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.3, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 },
    heroSub: { fontSize: 11, color: '#bbb', marginBottom: 12 },
    tabs: { display: 'flex', borderBottom: '0.5px solid #f0e8d0', background: '#fff' },
    tab: active => ({ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: active ? 500 : 400, color: active ? '#BA7517' : '#bbb', textAlign: 'center', cursor: 'pointer', borderBottom: active ? '2px solid #BA7517' : '2px solid transparent', background: 'none', border: 'none', borderBottom: active ? '2px solid #BA7517' : '2px solid transparent' }),
  }

  return (
    <div style={S.page}>
      <TopBar right={
        <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 16, color: '#BA7517', opacity: 0.6, cursor: 'pointer' }}></i>
      } />

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.glow} />
        <div style={{ position: 'absolute', width: 80, height: 0.5, background: 'linear-gradient(90deg,transparent,#BA7517,transparent)', opacity: 0.2, top: '35%', left: -8 }} />
        <div style={{ ...S.timeBg }}><i className="fa-solid fa-trophy" aria-hidden="true"></i></div>
        {[[10,20],[25,62],[8,42]].map(([t,l],i) => (
          <div key={i} style={{ position:'absolute', top:`${t}%`, left:`${l}%`, width:2, height:2, borderRadius:'50%', background:'#BA7517', opacity:0.4+i*0.1 }} />
        ))}
        <div style={S.badge}>
          {member && <PokeballIcon level={member.level} size={24} />}
          <span style={{ fontSize: 6, color: '#BA7517', fontWeight: 600 }}>{member?.level}</span>
        </div>
        <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, opacity: 0.55, letterSpacing: '0.1em', marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
        <div style={S.heroTitle}>
          <i className="fa-solid fa-trophy" style={{ fontSize: 13, color: '#BA7517' }} aria-hidden="true"></i>
          戰績牆
        </div>
        <div style={S.heroSub}>
          {tab === 'all' ? `歷史開箱高光時刻 · 共 ${cards.length} 張` : `我的開箱紀錄 · 共 ${myCards.length} 張`}
        </div>
      </div>

      {/* Tab 切換 */}
      <div style={S.tabs}>
        <button style={S.tab(tab === 'all')} onClick={() => setTab('all')}>
          <i className="fa-solid fa-globe" style={{ marginRight: 5, fontSize: 12 }} aria-hidden="true"></i>
          全部紀錄
        </button>
        <button style={S.tab(tab === 'my')} onClick={() => setTab('my')}>
          <i className="fa-solid fa-user" style={{ marginRight: 5, fontSize: 12 }} aria-hidden="true"></i>
          我的戰績
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 14 }}>載入中...</div>
        ) : displayCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#bbb' }}>
            <i className="fa-solid fa-id-card" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.3 }} aria-hidden="true"></i>
            <div style={{ fontSize: 14 }}>{tab === 'my' ? '還沒有開箱紀錄' : '暫無卡牌'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, padding: '14px 20px 20px' }}>
            {displayCards.map((card, idx) => {
              const rc = RARITY_COLORS[card.rarity] || RARITY_COLORS.Other
              return (
                <div key={card.id} onClick={() => setSelected(card)}
                  style={{ border: '0.5px solid #f0e8d0', borderRadius: 12, overflow: 'hidden', background: '#fff', cursor: 'pointer', boxShadow: '0 1px 8px rgba(186,117,23,0.06)' }}>
                  <div style={{ aspectRatio: '3/4', background: '#f8f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    {card.image_url
                      ? <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <i className="fa-solid fa-id-card" style={{ fontSize: 40, color: '#D4A94A', opacity: 0.3 }} aria-hidden="true"></i>}
                    <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 20, background: rc.bg, color: rc.color }}>{card.rarity}</span>
                    {idx === 0 && tab === 'all' && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 20, background: '#E24B4A', color: 'white' }}>NEW</span>}
                  </div>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#111', marginBottom: 4 }}>{card.name}</div>
                    <div style={{ fontSize: 10, color: '#BA7517', marginBottom: 6 }}>{card.series}</div>
                    {tab === 'all' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingTop: 6, borderTop: '0.5px solid #f5f0e8' }}>
                        {card.card_owners?.[0]?.members?.avatar_url
                          ? <img src={card.card_owners[0].members.avatar_url} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid #FAC775' }} />
                          : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 600, color: '#633806', border: '0.5px solid #FAC775' }}>
                              {card.card_owners?.[0]?.members?.display_name?.[0]?.toUpperCase() || '?'}
                            </div>
                        }
                        <span style={{ fontSize: 9, color: '#999', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {card.card_owners?.map(o => o.members?.display_name).join(', ') || '-'}
                        </span>
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
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: 20 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '0 auto 16px' }} />
            <div style={{ width: '100%', aspectRatio: '3/4', maxWidth: 140, margin: '0 auto 14px', borderRadius: 10, background: '#f8f5f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #f0e8d0' }}>
              {selected.image_url
                ? <img src={selected.image_url} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <i className="fa-solid fa-id-card" style={{ fontSize: 48, color: '#D4A94A', opacity: 0.3 }} aria-hidden="true"></i>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: RARITY_COLORS[selected.rarity]?.bg || '#f5f5f5', color: RARITY_COLORS[selected.rarity]?.color || '#666' }}>{selected.rarity}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#111', textAlign: 'center', marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: '#BA7517', textAlign: 'center', marginBottom: 16 }}>{selected.series}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>開卡會員</div>
            {selected.card_owners?.map(o => (
              <div key={o.member_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '0.5px solid #f0e8d0', borderRadius: 10, marginBottom: 8, background: 'linear-gradient(135deg,#fdfaf4,#fff)' }}>
                {o.members?.avatar_url
                  ? <img src={o.members.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#633806', border: '1.5px solid #FAC775' }}>
                      {o.members?.display_name?.[0]?.toUpperCase()}
                    </div>
                }
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 3 }}>{o.members?.display_name}</div>
                  <LevelBadge level={o.members?.level} size='sm' />
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
