import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PokeballIcon } from '../lib/pokeballs'
import BottomNav from '../components/BottomNav'

const TIER_CONFIG = {
  general: {
    key: 'general',
    name: '一般商城',
    icon: 'fa-solid fa-store',
    iconColor: '#E07B00',
    cardBg: '#fff',
    cardBorder: '#F5E8C8',
    headerBg: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)',
    iconBg: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)',
    badgeOpen: { bg: '#FFF3E0', color: '#E07B00' },
    badgeLocked: { bg: '#f5f5f5', color: '#bbb' },
    lockColor: '#CBD5E1',
    lockTextColor: '#94A3B8',
    divider: '#F5E8C8',
    enterColor: '#E07B00',
    allowedLevels: ['精靈球', '超級球'],
    lockMsg: '精靈球以上即可進入',
  },
  premium: {
    key: 'premium',
    name: '高級商城',
    icon: 'fa-solid fa-gem',
    iconColor: '#3B82F6',
    cardBg: '#fff',
    cardBorder: '#CBD5E1',
    headerBg: 'linear-gradient(135deg,#E8EFF6,#CBD5E1)',
    iconBg: 'linear-gradient(135deg,#E8EFF6,#CBD5E1)',
    badgeOpen: { bg: '#EFF6FF', color: '#3B82F6' },
    badgeLocked: { bg: '#EFF6FF', color: '#3B82F6' },
    lockColor: '#CBD5E1',
    lockTextColor: '#94A3B8',
    divider: '#E2E8F0',
    enterColor: '#3B82F6',
    allowedLevels: ['高級球', '豪華球', '貴重球', '究極球'],
    lockMsg: '升至高級球以上即可進入',
  },
  vip: {
    key: 'vip',
    name: 'VIP 商城',
    icon: 'fa-solid fa-crown',
    iconColor: '#F5D060',
    cardBg: '#1A1A1A',
    cardBorder: '#B8860B',
    headerBg: '#2A2A1A',
    iconBg: '#2A2A1A',
    badgeOpen: { bg: '#2A2200', color: '#F5D060' },
    badgeLocked: { bg: '#2A2200', color: '#F5D060' },
    lockColor: '#B8860B',
    lockTextColor: '#666',
    divider: '#B8860B44',
    enterColor: '#F5D060',
    allowedLevels: ['大師球'],
    lockMsg: '僅大師球會員可進入',
  },
}

const LEVEL_ORDER = ['精靈球', '超級球', '高級球', '豪華球', '貴重球', '究極球', '大師球']

function canAccess(memberLevel, tier) {
  return TIER_CONFIG[tier].allowedLevels.includes(memberLevel)
}

const POKEBALL_SVG = {
  精靈球: `<svg width="16" height="16" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="#fff" stroke="#ccc" stroke-width="1"/><path d="M2 26 A24 24 0 0 1 50 26 Z" fill="#E24B4A"/><rect x="2" y="23" width="48" height="6" fill="#1a1a1a"/><circle cx="26" cy="26" r="7" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/><circle cx="26" cy="26" r="3.5" fill="#e8e8e8"/></svg>`,
  超級球: `<svg width="16" height="16" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="#fff" stroke="#ccc" stroke-width="1"/><path d="M2 26 A24 24 0 0 1 50 26 Z" fill="#378ADD"/><polygon points="15,8 22,14 15,20 8,14" fill="#E24B4A"/><polygon points="37,8 44,14 37,20 30,14" fill="#E24B4A"/><rect x="2" y="23" width="48" height="6" fill="#1a1a1a"/><circle cx="26" cy="26" r="7" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/><circle cx="26" cy="26" r="3.5" fill="#e8e8e8"/></svg>`,
  高級球: `<svg width="16" height="16" viewBox="0 0 52 52"><defs><clipPath id="gc"><circle cx="26" cy="26" r="23.5"/></clipPath></defs><circle cx="26" cy="26" r="24" fill="#fff" stroke="#ccc" stroke-width="1"/><path d="M2 26 A24 24 0 0 1 50 26 Z" fill="#3a3a3a" clip-path="url(#gc)"/><rect x="17" y="2" width="6" height="22" fill="#EF9F27" clip-path="url(#gc)"/><rect x="29" y="2" width="6" height="22" fill="#EF9F27" clip-path="url(#gc)"/><rect x="2" y="23" width="48" height="6" fill="#1a1a1a" clip-path="url(#gc)"/><circle cx="26" cy="26" r="7" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/><circle cx="26" cy="26" r="3.5" fill="#e8e8e8"/></svg>`,
  豪華球: `<svg width="16" height="16" viewBox="0 0 52 52"><defs><clipPath id="lc"><circle cx="26" cy="26" r="23.5"/></clipPath></defs><circle cx="26" cy="26" r="24" fill="#111" stroke="#555" stroke-width="1"/><rect x="2" y="9" width="48" height="2" fill="#BA7517" clip-path="url(#lc)"/><rect x="2" y="11" width="48" height="6" fill="#E24B4A" clip-path="url(#lc)"/><rect x="2" y="17" width="48" height="2" fill="#BA7517" clip-path="url(#lc)"/><rect x="2" y="23" width="48" height="6" fill="#BA7517" clip-path="url(#lc)"/><circle cx="26" cy="26" r="8" fill="#111" stroke="#BA7517" stroke-width="3"/><circle cx="26" cy="26" r="4" fill="#BA7517"/><circle cx="26" cy="26" r="2" fill="#EF9F27"/></svg>`,
  貴重球: `<svg width="16" height="16" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="#111" stroke="#444" stroke-width="1"/><path d="M2 26 A24 24 0 0 1 50 26 Z" fill="#A32D2D"/><rect x="2" y="23" width="48" height="6" fill="#000"/><circle cx="26" cy="26" r="7" fill="#111" stroke="#E24B4A" stroke-width="2.5"/><circle cx="26" cy="26" r="3.5" fill="#E24B4A"/><circle cx="26" cy="26" r="1.5" fill="#ff8888"/></svg>`,
  究極球: `<svg width="16" height="16" viewBox="0 0 52 52"><defs><clipPath id="uc"><circle cx="26" cy="26" r="23.5"/></clipPath></defs><circle cx="26" cy="26" r="24" fill="#2244bb" stroke="#4466dd" stroke-width="1.5"/><line x1="26" y1="2" x2="26" y2="50" stroke="#66aaff" stroke-width="1" clip-path="url(#uc)"/><line x1="2" y1="26" x2="50" y2="26" stroke="#66aaff" stroke-width="1" clip-path="url(#uc)"/><circle cx="26" cy="26" r="18" fill="none" stroke="#66aaff" stroke-width="1"/><circle cx="26" cy="26" r="10" fill="none" stroke="#66aaff" stroke-width="1"/><ellipse cx="26" cy="8" rx="3" ry="7" fill="#EF9F27"/><ellipse cx="26" cy="44" rx="3" ry="7" fill="#EF9F27"/><ellipse cx="8" cy="26" rx="7" ry="3" fill="#EF9F27"/><ellipse cx="44" cy="26" rx="7" ry="3" fill="#EF9F27"/><circle cx="26" cy="26" r="6" fill="#2244bb" stroke="#88bbff" stroke-width="1.5"/><circle cx="26" cy="26" r="3" fill="#aaccff"/></svg>`,
  大師球: `<svg width="16" height="16" viewBox="0 0 52 52"><defs><clipPath id="mc"><circle cx="26" cy="26" r="23.5"/></clipPath></defs><circle cx="26" cy="26" r="24" fill="#fff" stroke="#ccc" stroke-width="1"/><path d="M2 26 A24 24 0 0 1 50 26 Z" fill="#7755cc" clip-path="url(#mc)"/><ellipse cx="14" cy="13" rx="8" ry="5.5" fill="#E24B4A" clip-path="url(#mc)"/><ellipse cx="38" cy="13" rx="8" ry="5.5" fill="#E24B4A" clip-path="url(#mc)"/><text x="26" y="23" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff" font-family="sans-serif">M</text><rect x="2" y="23" width="48" height="6" fill="#1a1a1a"/><circle cx="26" cy="26" r="7" fill="#fff" stroke="#1a1a1a" stroke-width="2.5"/><circle cx="26" cy="26" r="3.5" fill="#e8e8e8"/></svg>`,
}

function BallTag({ level, cls, textColor }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, padding: '2px 8px 2px 3px', borderRadius: 99,
      background: cls === 'vip' ? '#222' : cls === 'plat' ? '#F8FAFC' : '#FFFBF2',
      color: textColor || (cls === 'vip' ? '#A0956A' : cls === 'plat' ? '#64748B' : '#BA7517'),
      border: `0.5px solid ${cls === 'vip' ? '#B8860B55' : cls === 'plat' ? '#E2E8F0' : '#F5E8C8'}`,
    }}>
      <span dangerouslySetInnerHTML={{ __html: POKEBALL_SVG[level] }} style={{ display: 'inline-flex', alignItems: 'center' }} />
      {level}
    </span>
  )
}

export default function ShopPage() {
  const { member, setMember } = useAuth()
  const [products, setProducts] = useState([])
  const [pointsLogs, setPointsLogs] = useState([])
  const [shopOrders, setShopOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [productsError, setProductsError] = useState(null)
  const [activeTier, setActiveTier] = useState(null) // 進入的商城
  const [confirmProduct, setConfirmProduct] = useState(null)
  const [buying, setBuying] = useState(false)
  const [showPointsLog, setShowPointsLog] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [successProduct, setSuccessProduct] = useState(null)

  useEffect(() => { if (member) fetchData() }, [member])

  async function fetchData() {
    setLoading(true)
    const [{ data: prods, error: productsFetchError }, { data: logs }, { data: orders }] = await Promise.all([
      supabase.from('shop_products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('points_logs').select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('shop_orders').select('*, shop_products(name, image_url)').eq('member_id', member.id).order('created_at', { ascending: false }).limit(30),
    ])
    setProductsError(productsFetchError)
    setProducts(prods || [])
    setPointsLogs(logs || [])
    setShopOrders(orders || [])
    setLoading(false)
  }

  async function handleBuy() {
    if (!confirmProduct || !member) return
    if (member.shop_points < confirmProduct.price) return
    setBuying(true)
    try {
      const newPoints = member.shop_points - confirmProduct.price
      // 扣點
      await supabase.from('members').update({ shop_points: newPoints }).eq('id', member.id)
      // 扣庫存
      await supabase.from('shop_products').update({ stock: confirmProduct.stock - 1 }).eq('id', confirmProduct.id)
      // 訂單紀錄
      await supabase.from('shop_orders').insert({
        member_id: member.id,
        product_id: confirmProduct.id,
        product_name: confirmProduct.name,
        points_spent: confirmProduct.price,
      })
      // 點數紀錄
      await supabase.from('points_logs').insert({
        member_id: member.id,
        points: -confirmProduct.price,
        type: 'shop',
        note: `兌換：${confirmProduct.name}`,
      })
      setMember({ ...member, shop_points: newPoints })
      setSuccessProduct(confirmProduct)
      setConfirmProduct(null)
      await fetchData()
    } catch (err) {
      alert('兌換失敗：' + err.message)
    }
    setBuying(false)
  }

  if (!member) return null

  const tierProducts = (tier) => products.filter(p => p.tier === tier)

  const S = {
    page: { maxWidth: 390, margin: '0 auto', background: '#FFFBF2', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  }

  // 商城內部頁面
  if (activeTier) {
    const cfg = TIER_CONFIG[activeTier]
    const tierProds = tierProducts(activeTier)
    const isVip = activeTier === 'vip'
    return (
      <div style={S.page}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ background: isVip ? '#1A1A1A' : 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)', padding: '18px 20px 16px', borderBottom: `0.5px solid ${cfg.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <button onClick={() => setActiveTier(null)} style={{ width: 32, height: 32, borderRadius: '50%', border: `0.5px solid ${cfg.divider}`, background: isVip ? '#222' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-arrow-left" style={{ fontSize: 12, color: isVip ? '#F5D060' : '#888' }}></i>
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: isVip ? '#F5D060' : '#2D1A00', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className={cfg.icon} style={{ fontSize: 15, color: cfg.iconColor }}></i>
                  {cfg.name}
                </div>
                <div style={{ fontSize: 11, color: isVip ? '#666' : '#bbb', marginTop: 2 }}>{tierProds.length} 項商品</div>
              </div>
              <div style={{ background: isVip ? '#2A2200' : '#fff', border: `1.5px solid ${isVip ? '#B8860B' : '#FAC775'}`, borderRadius: 12, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: isVip ? '#F5D060' : '#E07B00' }}>{(member.shop_points || 0).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: isVip ? '#666' : '#bbb', marginTop: 1 }}>可用點數</div>
              </div>
            </div>
          </div>

          {/* 商品 Grid */}
          <div style={{ padding: '14px 16px 28px' }}>
            {productsError ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#A32D2D' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 28, display: 'block', marginBottom: 10, opacity: 0.7 }}></i>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>商品載入失敗</div>
                <div style={{ fontSize: 11, lineHeight: 1.5 }}>請稍後再試，或通知管理員檢查商城權限設定。</div>
              </div>
            ) : tierProds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: isVip ? '#444' : '#bbb' }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: 0.3 }}></i>
                <div style={{ fontSize: 13 }}>目前無商品</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {tierProds.map(prod => {
                  const soldOut = prod.stock <= 0
                  return (
                    <div key={prod.id}
                      onClick={() => !soldOut && setConfirmProduct(prod)}
                      style={{ background: isVip ? '#222' : '#fff', border: `0.5px solid ${cfg.divider}`, borderRadius: 14, overflow: 'hidden', cursor: soldOut ? 'not-allowed' : 'pointer', opacity: soldOut ? 0.5 : 1, boxShadow: isVip ? 'none' : '0 2px 10px rgba(186,117,23,.07)' }}>
                      <div style={{ aspectRatio: '1', background: isVip ? '#1A1A1A' : '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                        {prod.image_url
                          ? <img src={prod.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <i className="fa-solid fa-gift" style={{ fontSize: 36, color: isVip ? '#B8860B' : '#D4A94A', opacity: 0.4 }}></i>
                        }
                        {soldOut && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 8 }}>已售完</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '10px 10px 12px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isVip ? '#E8D5A0' : '#2D1A00', marginBottom: 4 }}>{prod.name}</div>
                        {prod.description && <div style={{ fontSize: 10, color: isVip ? '#666' : '#bbb', marginBottom: 6, lineHeight: 1.4 }}>{prod.description}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: cfg.enterColor }}>
                            <i className="fa-solid fa-coins" style={{ fontSize: 10, marginRight: 3 }}></i>
                            {prod.price} 點
                          </div>
                          <div style={{ fontSize: 9, color: isVip ? '#555' : '#bbb' }}>庫存 {prod.stock}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <BottomNav />

        {/* 確認購買彈窗 */}
        {confirmProduct && (
          <div onClick={() => setConfirmProduct(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, background: '#fff', borderRadius: '16px 16px 0 0', padding: '0 0 32px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 16px' }} />
              <div style={{ padding: '0 20px' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', marginBottom: 4 }}>確認兌換</div>
                <div style={{ fontSize: 12, color: '#bbb', marginBottom: 18 }}>點數扣除後無法退還，請確認後再兌換</div>
                <div style={{ display: 'flex', gap: 14, padding: '14px', background: '#FFFBF2', borderRadius: 12, border: '0.5px solid #F5E8C8', marginBottom: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: '#FFF5E0', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #F5E8C8' }}>
                    {confirmProduct.image_url
                      ? <img src={confirmProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <i className="fa-solid fa-gift" style={{ fontSize: 28, color: '#D4A94A', opacity: 0.5 }}></i>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2D1A00', marginBottom: 4 }}>{confirmProduct.name}</div>
                    {confirmProduct.description && <div style={{ fontSize: 11, color: '#bbb', marginBottom: 8 }}>{confirmProduct.description}</div>}
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#E07B00' }}>
                      <i className="fa-solid fa-coins" style={{ fontSize: 11, marginRight: 3 }}></i>
                      {confirmProduct.price} 點
                    </div>
                  </div>
                </div>
                <div style={{ background: '#f8f5f0', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
                    <span>目前點數</span><span style={{ fontWeight: 700, color: '#2D1A00' }}>{(member.shop_points || 0).toLocaleString()} 點</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
                    <span>兌換費用</span><span style={{ fontWeight: 700, color: '#E24B4A' }}>-{confirmProduct.price} 點</span>
                  </div>
                  <div style={{ height: '0.5px', background: '#f0e8d0', margin: '6px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                    <span>兌換後點數</span>
                    <span style={{ fontWeight: 800, color: (member.shop_points || 0) - confirmProduct.price >= 0 ? '#E07B00' : '#E24B4A' }}>
                      {((member.shop_points || 0) - confirmProduct.price).toLocaleString()} 點
                    </span>
                  </div>
                </div>
                {(member.shop_points || 0) < confirmProduct.price && (
                  <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#A32D2D', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-solid fa-triangle-exclamation"></i> 點數不足，無法兌換
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirmProduct(null)} style={{ flex: 1, padding: 12, border: '0.5px solid #f0e8d0', borderRadius: 10, fontSize: 14, color: '#888', background: '#fdfaf4', cursor: 'pointer' }}>取消</button>
                  <button
                    onClick={handleBuy}
                    disabled={buying || (member.shop_points || 0) < confirmProduct.price}
                    style={{ flex: 2, padding: 12, background: buying || (member.shop_points || 0) < confirmProduct.price ? '#ccc' : 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: buying || (member.shop_points || 0) < confirmProduct.price ? 'not-allowed' : 'pointer' }}>
                    {buying ? '處理中...' : '確認兌換'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 兌換成功 */}
        {successProduct && (
          <div onClick={() => setSuccessProduct(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: '28px 24px', maxWidth: 300, width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <i className="fa-solid fa-check" style={{ fontSize: 24, color: '#388E3C' }}></i>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#2D1A00', marginBottom: 6 }}>兌換成功！</div>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{successProduct.name}</div>
              <div style={{ fontSize: 12, color: '#E07B00', marginBottom: 20 }}>已扣除 {successProduct.price} 點</div>
              <button onClick={() => setSuccessProduct(null)} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>確定</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 商城主頁
  return (
    <div style={S.page}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)', padding: '18px 20px 16px', borderBottom: '0.5px solid #F5E8C8' }}>
          <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.6, marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="fa-solid fa-store" style={{ fontSize: 15, color: '#E07B00' }}></i> 商城
              </div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>使用點數兌換專屬好禮</div>
            </div>
            <div style={{ background: '#fff', border: '1.5px solid #FAC775', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#E07B00' }}>{(member.shop_points || 0).toLocaleString()}</div>
              <div style={{ fontSize: 9, color: '#bbb', marginTop: 1 }}>可用點數</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[
              { label: '本月獲得', icon: 'fa-arrow-up', iconColor: '#78C850', value: `+${pointsLogs.filter(l => l.points > 0 && new Date(l.created_at).getMonth() === new Date().getMonth()).reduce((s, l) => s + l.points, 0)} 點` },
              { label: '本月使用', icon: 'fa-arrow-down', iconColor: '#E24B4A', value: `-${Math.abs(pointsLogs.filter(l => l.points < 0 && new Date(l.created_at).getMonth() === new Date().getMonth()).reduce((s, l) => s + l.points, 0))} 點` },
              { label: '即將到期', icon: 'fa-clock', iconColor: '#E07B00', value: '計算中', isReg: true },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: '#fff', border: '0.5px solid #F5E8C8', borderRadius: 10, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className={`fa-${s.isReg ? 'regular' : 'solid'} fa-${s.icon}`} style={{ fontSize: 9, color: s.iconColor }}></i>{s.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: i === 2 ? '#E07B00' : '#2D1A00', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowPointsLog(true)} style={{ flex: 1, padding: 8, background: '#FFFBF2', border: '0.5px solid #F5E8C8', borderRadius: 8, fontSize: 11, color: '#BA7517', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 11 }}></i>點數紀錄
            </button>
            <button onClick={() => setShowOrders(true)} style={{ flex: 1, padding: 8, background: '#FFFBF2', border: '0.5px solid #F5E8C8', borderRadius: 8, fontSize: 11, color: '#BA7517', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <i className="fa-solid fa-receipt" style={{ fontSize: 11 }}></i>消費紀錄
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 16px 10px', fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="fa-solid fa-circle-info" style={{ color: '#E07B00' }}></i>
          你的等級：{member.level} · 目前可進入{canAccess(member.level, 'vip') ? 'VIP 商城' : canAccess(member.level, 'premium') ? '高級商城' : canAccess(member.level, 'general') ? '一般商城' : '（暫無可進入的商城）'}
        </div>

        <div style={{ padding: '0 0 28px' }}>
          {['general', 'premium', 'vip'].map(tier => {
            const cfg = TIER_CONFIG[tier]
            const accessible = canAccess(member.level, tier)
            const isVip = tier === 'vip'
            const count = tierProducts(tier).length
            return (
              <div key={tier} style={{ margin: '0 16px 12px', borderRadius: 16, overflow: 'hidden', background: cfg.cardBg, border: `1.5px solid ${cfg.cardBorder}` }}>
                {/* Header */}
                <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.iconBg, border: isVip ? '1px solid #B8860B' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={cfg.icon} style={{ fontSize: 20, color: cfg.iconColor }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isVip ? '#F5D060' : '#2D1A00' }}>{cfg.name}</div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {cfg.allowedLevels.map(lv => (
                        <BallTag key={lv} level={lv} cls={isVip ? 'vip' : tier === 'premium' ? 'plat' : 'cream'} />
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, fontWeight: 600, background: accessible ? cfg.badgeOpen.bg : cfg.badgeLocked.bg, color: accessible ? cfg.badgeOpen.color : cfg.badgeLocked.color, border: isVip ? '0.5px solid #B8860B' : 'none', flexShrink: 0 }}>
                    {accessible ? '開放中' : '等級不足'}
                  </div>
                </div>
                {/* Divider */}
                <div style={{ height: '0.5px', margin: '0 16px', background: cfg.divider }} />
                {/* Footer */}
                {accessible ? (
                  <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: isVip ? '#555' : '#bbb', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className="fa-solid fa-box-open" style={{ fontSize: 11, color: isVip ? '#B8860B' : '#D4A94A' }}></i>
                      共 {count} 項商品
                    </div>
                    <div onClick={() => setActiveTier(tier)} style={{ fontSize: 12, color: cfg.enterColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                      進入商城 <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }}></i>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-lock" style={{ fontSize: 26, color: cfg.lockColor }}></i>
                    <div style={{ fontSize: 12, color: cfg.lockTextColor }}>{cfg.lockMsg}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 點數紀錄 Sheet */}
      {showPointsLog && (
        <div onClick={() => setShowPointsLog(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '80vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2D1A00' }}><i className="fa-solid fa-clock-rotate-left" style={{ color: '#E07B00', marginRight: 7 }}></i>點數紀錄</div>
              <span style={{ fontSize: 11, color: '#bbb' }}>{pointsLogs.length} 筆</span>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 32px' }}>
              {pointsLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#bbb', fontSize: 13 }}>尚無紀錄</div>
              ) : pointsLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: log.points > 0 ? '#EAF3DE' : '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fa-solid ${log.points > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`} style={{ fontSize: 13, color: log.points > 0 ? '#388E3C' : '#E24B4A' }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{log.note || log.type}</div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{new Date(log.created_at).toLocaleDateString('zh-TW')}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: log.points > 0 ? '#388E3C' : '#E24B4A' }}>
                    {log.points > 0 ? '+' : ''}{log.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 消費紀錄 Sheet */}
      {showOrders && (
        <div onClick={() => setShowOrders(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '80vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2D1A00' }}><i className="fa-solid fa-receipt" style={{ color: '#E07B00', marginRight: 7 }}></i>消費紀錄</div>
              <span style={{ fontSize: 11, color: '#bbb' }}>{shopOrders.length} 筆</span>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 32px' }}>
              {shopOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#bbb', fontSize: 13 }}>尚無消費紀錄</div>
              ) : shopOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '0.5px solid #F5E8C8', background: '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {order.shop_products?.image_url
                      ? <img src={order.shop_products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <i className="fa-solid fa-gift" style={{ fontSize: 18, color: '#D4A94A', opacity: 0.5 }}></i>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{order.product_name}</div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{new Date(order.created_at).toLocaleDateString('zh-TW')}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#E24B4A' }}>-{order.points_spent} 點</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
