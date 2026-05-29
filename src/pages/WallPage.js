import React, { useEffect, useState } from 'react'
import { supabase, RARITY_COLORS } from '../lib/supabase'
import TopBar from '../components/TopBar'
import { PokeballIcon, LevelBadge } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'

export default function WallPage() {
  const [cards, setCards] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    const { data } = await supabase.from('cards')
      .select('*, card_owners(member_id, members(display_name, level))')
      .order('created_at', { ascending: false })
    setCards(data || [])
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar right={<span style={{ fontSize: 20, cursor: 'pointer' }}>🔍</span>} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '18px 20px 14px' }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>🏆 戰績牆</div>
          <div style={{ fontSize: 13, color: '#999' }}>歷史開箱高光時刻 · 共 {cards.length} 張</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 14 }}>載入中...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, padding: '0 20px 20px' }}>
            {cards.map((card, idx) => {
              const rc = RARITY_COLORS[card.rarity] || RARITY_COLORS.Other
              return (
                <div key={card.id} onClick={() => setSelected(card)}
                  style={{ border: '0.5px solid #e5e5e5', borderRadius: 12, overflow: 'hidden', background: '#fff', cursor: 'pointer' }}>
                  <div style={{ aspectRatio: '3/4', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {card.image_url
                      ? <img src={card.image_url} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 40, color: '#ddd' }}>🎴</span>}
                    <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 500, padding: '2px 6px', borderRadius: 20, background: rc.bg, color: rc.color }}>{card.rarity}</span>
                    {idx === 0 && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 500, padding: '2px 6px', borderRadius: 20, background: '#E24B4A', color: 'white' }}>NEW</span>}
                  </div>
                  <div style={{ padding: '10px 10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 4 }}>{card.name}</div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>{card.series}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '0.5px solid #f0f0f0' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#633806' }}>
                        {card.card_owners?.[0]?.members?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: 11, color: '#999', flex: 1 }}>
                        {card.card_owners?.map(o => o.members?.display_name).join(', ') || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 390, padding: 20 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0e0e0', margin: '0 auto 16px' }} />
            <div style={{ width: '100%', aspectRatio: '3/4', maxWidth: 140, margin: '0 auto 16px', borderRadius: 10, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {selected.image_url
                ? <img src={selected.image_url} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 48, color: '#ddd' }}>🎴</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: RARITY_COLORS[selected.rarity]?.bg || '#f5f5f5', color: RARITY_COLORS[selected.rarity]?.color || '#666' }}>{selected.rarity}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#111', textAlign: 'center', marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16 }}>{selected.series}{selected.episode ? ` · ${selected.episode}` : ''}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>開卡會員</div>
            {selected.card_owners?.map(o => (
              <div key={o.member_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '0.5px solid #e5e5e5', borderRadius: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#633806' }}>
                  {o.members?.display_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{o.members?.display_name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}><LevelBadge level={o.members?.level} size='sm' /></div>
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
