// src/pages/WallPage.js
import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, RARITY_COLORS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { LevelBadge, PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'
import { playSound } from '../lib/sounds'
import { vibrate, VIBRATE } from '../lib/haptics'
import { SkeletonCardGrid } from '../components/Skeleton'
import { heroTheme } from '../lib/heroTheme'

const RARITIES = ['UR','HR','SAR','CSR','SSR','SR','AR','CHR','PROMO','Other']

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}

export default function WallPage() {
  const { member } = useAuth()
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [myCards, setMyCards] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('')

  useEffect(() => { fetchCards() }, [member])

  async function fetchCards() {
    // 全部卡片：用 SECURITY DEFINER RPC 繞過 RLS，取得含 members 資料的完整結果
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_cards_with_owners')
    if (!rpcErr && rpcData) {
      setCards(rpcData)
    } else {
      // fallback：直接查（members 欄位可能為 null，但至少卡片本身能顯示）
      const { data: allData } = await supabase.from('cards')
        .select('*, card_owners(member_id, created_at, members(display_name, level, avatar_url))')
        .order('created_at', { ascending: false })
      setCards(allData || [])
    }

    // 我的戰績：只查自己的 card_owners，不需要讀別人 members，RLS 不影響
    if (member) {
      const { data: myData } = await supabase.from('cards')
        .select('*, card_owners!inner(member_id, created_at, members(display_name, level, avatar_url))')
        .eq('card_owners.member_id', member.id)
        .order('created_at', { ascending: false })
      setMyCards(myData || [])
    }
    setLoading(false)
  }

  function switchTab(nextTab) {
    if (tab !== nextTab) { playSound('tab_switch'); vibrate(VIBRATE.light) }
    setTab(nextTab)
    setRarityFilter('')
  }

  function selectRarity(r) {
    playSound('button_tap')
    vibrate(VIBRATE.light)
    setRarityFilter(r)
  }

  function openCard(card) {
    playSound('modal_open')
    vibrate(VIBRATE.light)
    setSelected(card)
  }

  function closeCard() {
    playSound('modal_close')
    setSelected(null)
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

  const hero = heroTheme(member?.level)

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#FFFBF2', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    hero: { background: hero.bg, padding: '18px 20px 16px', position: 'relative', overflow: 'hidden', borderBottom: 'none' },
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
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${hero.avatarBorder}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hero.dark ? 'rgba(255,255,255,0.08)' : '#fff' }}>
              <PokeballIcon level={member.level} size={26} />
            </div>
          )}
          <span style={{ fontSize: 6, color: hero.levelText, fontWeight: 600 }}>{member?.level}</span>
        </div>
        <div style={{ fontSize: 9, color: hero.eyebrow, fontWeight: 600, opacity: 0.6, letterSpacing: '0.1em', marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: hero.name, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <i className="fa-solid fa-trophy" style={{ fontSize: 13, color: hero.accent }}></i>
          戰績牆
        </div>
        <div style={{ fontSize: 11, color: hero.sub }}>
          {tab === 'all'
            ? `歷史開箱高光時刻 · 共 ${rarityFilter ? `${displayCards.length}/` : ''}${cards.length} 張`
            : `我的開箱紀錄 · 共 ${rarityFilter ? `${displayCards.length}/` : ''}${myCards.length} 張`}
        </div>
      </div>

      {/* Tab 切換 */}
      <div style={S.tabBar}>
        <button style={S.tabBtn(tab === 'all')} onClick={() => switchTab('all')}>
          <i className="fa-solid fa-globe" style={{ marginRight: 5, fontSize: 12 }}></i>全部紀錄
        </button>
        <button style={S.tabBtn(tab === 'my')} onClick={() => switchTab('my')}>
          <i className="fa-solid fa-user" style={{ marginRight: 5, fontSize: 12 }}></i>我的戰績
        </button>
      </div>

      {/* 稀有度篩選列 */}
      {!loading && availableRarities.length > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #f5f0e8', overflowX: 'auto', display: 'flex', gap: 6, background: '#fff' }}>
          <button
            className="press-fx"
            onClick={() => selectRarity('')}
            style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${!rarityFilter ? '#FAC775' : '#f0e8d0'}`, background: !rarityFilter ? 'linear-gradient(135deg,#FAEEDA,#FFF3D0)' : '#f8f5f0', color: !rarityFilter ? '#8B5A00' : '#999' }}>
            全部
          </button>
          {availableRarities.map(r => {
            const rc = RARITY_COLORS[r] || RARITY_COLORS.Other
            const active = rarityFilter === r
            return (
              <button
                key={r}
                className="press-fx"
                onClick={() => selectRarity(active ? '' : r)}
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
          <SkeletonCardGrid count={6} />
        ) : displayCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#bbb' }}>
            <i className="fa-solid fa-id-card" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.3 }}></i>
            <div style={{ fontSize: 14 }}>
              {rarityFilter ? `沒有 ${rarityFilter} 稀有度的卡牌` : tab === 'my' ? '還沒有開箱紀錄' : '暫無卡牌'}
            </div>
            {tab === 'my' && !rarityFilter && (
              <button
                onClick={() => { playSound('button_tap'); vibrate(VIBRATE.light); navigate('/shop?tab=live') }}
                className="press-fx"
                style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 99, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 3px 12px rgba(186,117,23,0.25)' }}>
                <i className="fa-solid fa-video" style={{ fontSize: 11 }}></i>
                前往直播下單區
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, padding: '14px 20px 20px' }}>
            {displayCards.map((card, idx) => {
              const rc = RARITY_COLORS[card.rarity] || RARITY_COLORS.Other
              const owner = card.card_owners?.[0]
              return (
                <div key={card.id} className="press-fx-soft" onClick={() => openCard(card)}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 26, height: 26, background: '#111', borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, flexShrink: 0 }}>
                          <span style={{ fontSize: 7, fontWeight: 500, color: '#fff', letterSpacing: '0.08em' }}>SNKR</span>
                          <span style={{ fontSize: 7, fontWeight: 500, color: '#fff', letterSpacing: '0.08em' }}>DUNK</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#1a1a1a' }}>$ {card.snkr_price.toLocaleString()}</span>
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
                            {card.card_owners?.map(o => o.members?.display_name).filter(Boolean).join(', ') || '-'}
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
        <div onClick={closeCard} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '14px 16px', background: '#F8F8F8', borderRadius: 12, border: '1px solid #E8E8E8', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, background: '#111', borderRadius: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '0.14em' }}>SNKR</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '0.14em' }}>DUNK</span>
                </div>
                <div style={{ width: '0.5px', height: 30, background: '#E0E0E0', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>SNKR 成交價</div>
                  <div style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
                    $ {selected.snkr_price.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>開卡會員</div>
            {selected.card_owners?.length > 0 ? selected.card_owners.map(o => (
              <div key={o.member_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '0.5px solid #f0e8d0', borderRadius: 10, marginBottom: 8, background: 'linear-gradient(135deg,#fdfaf4,#fff)' }}>
                {o.members?.avatar_url
                  ? <img src={o.members.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FAC775' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#633806', border: '1.5px solid #FAC775' }}>
                      {o.members?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 3 }}>
                    {o.members?.display_name || '未知會員'}
                  </div>
                  {o.members?.level && <LevelBadge level={o.members.level} size='sm' />}
                  {o.created_at && (
                    <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>
                      <i className="fa-regular fa-calendar" style={{ marginRight: 3 }}></i>
                      獲得於 {formatDate(o.created_at)}
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: '#ccc', textAlign: 'center', padding: '12px 0' }}>尚無會員資料</div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
