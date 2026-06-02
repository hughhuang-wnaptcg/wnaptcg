import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'

const TIER_CONFIG = {
  general: {
    key: 'general', name: '一般商城', icon: 'fa-solid fa-store', iconColor: '#E07B00',
    cardBg: '#fff', cardBorder: '#F5E8C8', iconBg: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)',
    badgeOpen: { bg: '#FFF3E0', color: '#E07B00' }, badgeLocked: { bg: '#f5f5f5', color: '#bbb' },
    lockColor: '#CBD5E1', lockTextColor: '#94A3B8', divider: '#F5E8C8', enterColor: '#E07B00',
    allowedLevels: ['精靈球', '超級球', '高級球', '豪華球', '貴重球', '究極球', '大師球'], lockMsg: '所有會員皆可進入',
  },
  premium: {
    key: 'premium', name: '高級商城', icon: 'fa-solid fa-gem', iconColor: '#3B82F6',
    cardBg: '#fff', cardBorder: '#CBD5E1', iconBg: 'linear-gradient(135deg,#E8EFF6,#CBD5E1)',
    badgeOpen: { bg: '#EFF6FF', color: '#3B82F6' }, badgeLocked: { bg: '#EFF6FF', color: '#3B82F6' },
    lockColor: '#CBD5E1', lockTextColor: '#94A3B8', divider: '#E2E8F0', enterColor: '#3B82F6',
    allowedLevels: ['高級球', '豪華球', '貴重球', '究極球', '大師球'], lockMsg: '升至高級球以上即可進入',
  },
  vip: {
    key: 'vip', name: 'VIP 商城', icon: 'fa-solid fa-crown', iconColor: '#F5D060',
    cardBg: '#1A1A1A', cardBorder: '#B8860B', iconBg: '#2A2A1A',
    badgeOpen: { bg: '#2A2200', color: '#F5D060' }, badgeLocked: { bg: '#2A2200', color: '#F5D060' },
    lockColor: '#B8860B', lockTextColor: '#666', divider: '#B8860B44', enterColor: '#F5D060',
    allowedLevels: ['大師球'], lockMsg: '僅大師球會員可進入',
  },
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

function BallTag({ level, cls }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 8px 2px 3px', borderRadius: 99, background: cls === 'vip' ? '#222' : cls === 'plat' ? '#F8FAFC' : '#FFFBF2', color: cls === 'vip' ? '#A0956A' : cls === 'plat' ? '#64748B' : '#BA7517', border: `0.5px solid ${cls === 'vip' ? '#B8860B55' : cls === 'plat' ? '#E2E8F0' : '#F5E8C8'}` }}>
      <span dangerouslySetInnerHTML={{ __html: POKEBALL_SVG[level] }} style={{ display: 'inline-flex', alignItems: 'center' }} />{level}
    </span>
  )
}

function AccessTag({ tier }) {
  if (tier === 'general') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '3px 8px', borderRadius: 99, background: '#FFFBF2', color: '#BA7517', border: '0.5px solid #F5E8C8' }}>
        所有會員
      </span>
    )
  }

  const isVip = tier === 'vip'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 8px 2px 3px', borderRadius: 99, background: isVip ? '#222' : '#F8FAFC', color: isVip ? '#A0956A' : '#64748B', border: `0.5px solid ${isVip ? '#B8860B55' : '#E2E8F0'}` }}>
      <span dangerouslySetInnerHTML={{ __html: POKEBALL_SVG[isVip ? '大師球' : '高級球'] }} style={{ display: 'inline-flex', alignItems: 'center' }} />
      {isVip ? '大師球限定' : '高級球以上'}
    </span>
  )
}

function canAccess(memberLevel, tier) {
  return TIER_CONFIG[tier].allowedLevels.includes(memberLevel)
}

function SuccessOverlay({ product, qty, onClose }) {
  const COLORS = ['#BA7517','#E24B4A','#378ADD','#06C755','#FAC775','#F85888','#7038F8','#78C850','#FF6B00','#00CFFF']
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    color: COLORS[i % COLORS.length], x: 10 + Math.random() * 80,
    delay: Math.random() * 0.5, dur: 0.8 + Math.random() * 0.6,
    size: 5 + Math.random() * 6, rotate: Math.random() * 360, shape: i % 3,
  }))
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(280px) rotate(720deg);opacity:0}}
        @keyframes checkPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15);opacity:1}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
        @keyframes cardSlideUp{0%{transform:translateY(40px);opacity:0}100%{transform:translateY(0);opacity:1}}
      `}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {pieces.map((p, i) => (
          <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: '-10px', width: p.shape === 2 ? p.size * 0.6 : p.size, height: p.shape === 2 ? p.size * 1.6 : p.size, borderRadius: p.shape === 0 ? '50%' : 2, background: p.color, animation: `confettiFall ${p.dur}s ${p.delay}s ease-in both`, transform: `rotate(${p.rotate}deg)` }} />
        ))}
      </div>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '32px 28px 24px', maxWidth: 300, width: '88%', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.2)', animation: 'cardSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#EAF3DE,#D4F0B8)', border: '2px solid #86C566', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'checkPop 0.5s 0.15s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <i className="fa-solid fa-check" style={{ fontSize: 26, color: '#388E3C' }}></i>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#2D1A00', marginBottom: 6 }}>兌換成功！</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{product.name} × {qty}</div>
        <div style={{ fontSize: 12, color: '#E07B00', fontWeight: 600, marginBottom: 6 }}>
          <i className="fa-solid fa-coins" style={{ fontSize: 10, marginRight: 3 }}></i>已扣除 {product.price * qty} 點
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginBottom: 20, padding: '8px 12px', background: '#FFFBF2', borderRadius: 8, border: '0.5px solid #F5E8C8' }}>
          商品已進入「我的物品」，可前往申請出貨
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>確定</button>
      </div>
    </div>
  )
}

export default function ShopPage() {
  const { member, setMember } = useAuth()
  const [products, setProducts] = useState([])
  const [pointsLogs, setPointsLogs] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [shippedOrders, setShippedOrders] = useState([])
  const [purchasedCounts, setPurchasedCounts] = useState({}) // product_id -> count
  const [loading, setLoading] = useState(true)
  const [productsError, setProductsError] = useState(null)
  const [activeTier, setActiveTier] = useState(null)
  const [confirmProduct, setConfirmProduct] = useState(null)
  const [confirmQty, setConfirmQty] = useState(1)
  const [buying, setBuying] = useState(false)
  const [showPointsLog, setShowPointsLog] = useState(false)
  const [showMyItems, setShowMyItems] = useState(false)
  const [showShipped, setShowShipped] = useState(false)
  const [successProduct, setSuccessProduct] = useState(null)
  const [successQty, setSuccessQty] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  useEffect(() => { if (member) fetchData() }, [member])

  async function fetchData() {
    setLoading(true)
    const [{ data: prods, error: pe }, { data: logs }, { data: allOrders }] = await Promise.all([
      supabase.from('shop_products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('points_logs').select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('shop_orders').select('*, shop_products(name, image_url)').eq('member_id', member.id).order('created_at', { ascending: false }).limit(200),
    ])
    setProductsError(pe)
    setProducts(prods || [])
    setPointsLogs(logs || [])
    const all = allOrders || []
    setPendingOrders(all.filter(o => o.status === 'pending' || o.status === 'shipping_requested'))
    setShippedOrders(all.filter(o => o.status === 'shipped'))

    // 計算每個商品已購買幾個（未取消）
    const counts = {}
    all.filter(o => o.status !== 'cancelled').forEach(o => {
      counts[o.product_id] = (counts[o.product_id] || 0) + 1
    })
    setPurchasedCounts(counts)
    setLoading(false)
  }

  function openConfirm(prod) {
    setConfirmProduct(prod)
    setConfirmQty(1)
  }

  // 計算這個商品還能買幾個
  function remainingAllowance(prod) {
    const max = prod.max_per_member || 1
    const bought = purchasedCounts[prod.id] || 0
    return Math.max(0, max - bought)
  }

  async function handleBuy() {
    if (!confirmProduct || !member) return
    const totalCost = confirmProduct.price * confirmQty
    if (member.shop_points < totalCost) return
    if (confirmQty < 1) return
    setBuying(true)
    try {
      const { data, error } = await supabase.rpc('purchase_shop_product', {
        p_product_id: confirmProduct.id,
        p_quantity: confirmQty,
      })
      if (error) throw error

      setMember({ ...member, shop_points: data.shop_points })
      setSuccessProduct(confirmProduct)
      setSuccessQty(confirmQty)
      setConfirmProduct(null)
      await fetchData()
    } catch (err) {
      alert('兌換失敗：' + err.message)
    }
    setBuying(false)
  }

  async function handleRequestShipping() {
    if (selectedIds.length === 0) return
    setRequesting(true)
    try {
      const { error } = await supabase.rpc('request_shop_order_shipping', {
        p_order_ids: selectedIds,
      })
      if (error) throw error

      setSelectedIds([])
      setRequestSuccess(true)
      await fetchData()
      setTimeout(() => setRequestSuccess(false), 3000)
    } catch (err) {
      alert('申請失敗：' + err.message)
    }
    setRequesting(false)
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  if (!member) return null

  const tierProducts = (tier) => products.filter(p => p.tier === tier)
  const S = { page: { maxWidth: 390, margin: '0 auto', background: '#FFFBF2', minHeight: '100vh', display: 'flex', flexDirection: 'column' } }

  // 商城內部
  if (activeTier) {
    const cfg = TIER_CONFIG[activeTier]
    const tierProds = tierProducts(activeTier)
    const isVip = activeTier === 'vip'
    return (
      <div style={S.page}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ background: isVip ? '#1A1A1A' : 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)', padding: '18px 20px 16px', borderBottom: `0.5px solid ${cfg.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setActiveTier(null)} style={{ width: 32, height: 32, borderRadius: '50%', border: `0.5px solid ${cfg.divider}`, background: isVip ? '#222' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-solid fa-arrow-left" style={{ fontSize: 12, color: isVip ? '#F5D060' : '#888' }}></i>
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: isVip ? '#F5D060' : '#2D1A00', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className={cfg.icon} style={{ fontSize: 15, color: cfg.iconColor }}></i>{cfg.name}
                </div>
                <div style={{ fontSize: 11, color: isVip ? '#666' : '#bbb', marginTop: 2 }}>{tierProds.length} 項商品</div>
              </div>
              <div style={{ background: isVip ? '#2A2200' : '#fff', border: `1.5px solid ${isVip ? '#B8860B' : '#FAC775'}`, borderRadius: 12, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: isVip ? '#F5D060' : '#E07B00' }}>{(member.shop_points || 0).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: isVip ? '#666' : '#bbb', marginTop: 1 }}>可用點數</div>
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 16px 100px' }}>
            {productsError ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#A32D2D' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 28, display: 'block', marginBottom: 10, opacity: 0.7 }}></i>
                <div style={{ fontSize: 13, fontWeight: 700 }}>商品載入失敗</div>
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
                  const remaining = remainingAllowance(prod)
                  const maxed = remaining <= 0
                  const disabled = soldOut || maxed
                  return (
                    <div key={prod.id} onClick={() => !disabled && openConfirm(prod)}
                      style={{ background: isVip ? '#222' : '#fff', border: `0.5px solid ${cfg.divider}`, borderRadius: 14, overflow: 'hidden', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, boxShadow: isVip ? 'none' : '0 2px 10px rgba(186,117,23,.07)' }}>
                      <div style={{ aspectRatio: '1', background: isVip ? '#1A1A1A' : '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                        {prod.image_url ? <img src={prod.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-gift" style={{ fontSize: 36, color: isVip ? '#B8860B' : '#D4A94A', opacity: 0.4 }}></i>}
                        {soldOut && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 8 }}>已售完</span></div>}
                        {!soldOut && maxed && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 8 }}>已達上限</span></div>}
                        {(prod.max_per_member || 1) > 1 && !disabled && (
                          <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '2px 6px', borderRadius: 99 }}>
                            已買 {purchasedCounts[prod.id] || 0}/{prod.max_per_member}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '10px 10px 12px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isVip ? '#E8D5A0' : '#2D1A00', marginBottom: 4 }}>{prod.name}</div>
                        {prod.description && <div style={{ fontSize: 10, color: isVip ? '#666' : '#bbb', marginBottom: 6, lineHeight: 1.4 }}>{prod.description}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: cfg.enterColor }}><i className="fa-solid fa-coins" style={{ fontSize: 10, marginRight: 3 }}></i>{prod.price} 點</div>
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

        {/* 確認兌換 */}
        {confirmProduct && (() => {
          const remaining = remainingAllowance(confirmProduct)
          const maxQty = Math.min(remaining, confirmProduct.stock)
          const totalCost = confirmProduct.price * confirmQty
          const canAfford = (member.shop_points || 0) >= totalCost
          return (
            <div onClick={() => setConfirmProduct(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, background: '#fff', borderRadius: '16px 16px 0 0', padding: '0 0 32px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 16px' }} />
                <div style={{ padding: '0 20px' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', marginBottom: 4 }}>確認兌換</div>
                  <div style={{ fontSize: 12, color: '#bbb', marginBottom: 18 }}>點數扣除後無法退還，請確認後再兌換</div>
                  <div style={{ display: 'flex', gap: 14, padding: 14, background: '#FFFBF2', borderRadius: 12, border: '0.5px solid #F5E8C8', marginBottom: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 10, background: '#FFF5E0', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #F5E8C8' }}>
                      {confirmProduct.image_url ? <img src={confirmProduct.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-gift" style={{ fontSize: 28, color: '#D4A94A', opacity: 0.5 }}></i>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2D1A00', marginBottom: 4 }}>{confirmProduct.name}</div>
                      {confirmProduct.description && <div style={{ fontSize: 11, color: '#bbb', marginBottom: 6 }}>{confirmProduct.description}</div>}
                      <div style={{ fontSize: 12, color: '#E07B00', fontWeight: 700 }}><i className="fa-solid fa-coins" style={{ fontSize: 10, marginRight: 3 }}></i>{confirmProduct.price} 點 / 個</div>
                    </div>
                  </div>

                  {/* 數量選擇 */}
                  {maxQty > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f5f0', borderRadius: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 13, color: '#666' }}>兌換數量</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => setConfirmQty(q => Math.max(1, q - 1))}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #f0e8d0', background: '#fff', fontSize: 16, color: '#BA7517', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', minWidth: 24, textAlign: 'center' }}>{confirmQty}</span>
                        <button onClick={() => setConfirmQty(q => Math.min(maxQty, q + 1))}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #f0e8d0', background: '#fff', fontSize: 16, color: '#BA7517', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>＋</button>
                      </div>
                      <span style={{ fontSize: 11, color: '#bbb' }}>最多 {maxQty} 個</span>
                    </div>
                  )}

                  <div style={{ background: '#f8f5f0', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
                      <span>目前點數</span><span style={{ fontWeight: 700, color: '#2D1A00' }}>{(member.shop_points || 0).toLocaleString()} 點</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
                      <span>兌換費用 × {confirmQty}</span><span style={{ fontWeight: 700, color: '#E24B4A' }}>-{totalCost} 點</span>
                    </div>
                    <div style={{ height: '0.5px', background: '#f0e8d0', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666' }}>
                      <span>兌換後點數</span>
                      <span style={{ fontWeight: 800, color: canAfford ? '#E07B00' : '#E24B4A' }}>
                        {((member.shop_points || 0) - totalCost).toLocaleString()} 點
                      </span>
                    </div>
                  </div>
                  {!canAfford && (
                    <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#A32D2D', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fa-solid fa-triangle-exclamation"></i> 點數不足，無法兌換
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmProduct(null)} style={{ flex: 1, padding: 12, border: '0.5px solid #f0e8d0', borderRadius: 10, fontSize: 14, color: '#888', background: '#fdfaf4', cursor: 'pointer' }}>取消</button>
                    <button onClick={handleBuy} disabled={buying || !canAfford}
                      style={{ flex: 2, padding: 12, background: buying || !canAfford ? '#ccc' : 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', cursor: buying || !canAfford ? 'not-allowed' : 'pointer' }}>
                      {buying ? '處理中...' : `確認兌換${confirmQty > 1 ? ` × ${confirmQty}` : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {successProduct && <SuccessOverlay product={successProduct} qty={successQty} onClose={() => setSuccessProduct(null)} />}
      </div>
    )
  }

  // 商城主頁
  return (
    <div style={S.page}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
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
            <button onClick={() => setShowMyItems(true)} style={{ flex: 1, padding: 8, background: '#FFFBF2', border: '0.5px solid #F5E8C8', borderRadius: 8, fontSize: 11, color: '#BA7517', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, position: 'relative' }}>
              <i className="fa-solid fa-box" style={{ fontSize: 11 }}></i>我的物品
              {pendingOrders.length > 0 && <span style={{ position: 'absolute', top: 4, right: 8, background: '#E24B4A', color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700, padding: '1px 5px' }}>{pendingOrders.length}</span>}
            </button>
            <button onClick={() => setShowShipped(true)} style={{ flex: 1, padding: 8, background: '#FFFBF2', border: '0.5px solid #F5E8C8', borderRadius: 8, fontSize: 11, color: '#BA7517', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <i className="fa-solid fa-truck" style={{ fontSize: 11 }}></i>出貨紀錄
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
                <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.iconBg, border: isVip ? '1px solid #B8860B' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={cfg.icon} style={{ fontSize: 20, color: cfg.iconColor }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isVip ? '#F5D060' : '#2D1A00' }}>{cfg.name}</div>
                    <div style={{ marginTop: 6 }}>
                      <AccessTag tier={tier} />
                    </div>
                  </div>
                  <div style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, fontWeight: 600, background: accessible ? cfg.badgeOpen.bg : cfg.badgeLocked.bg, color: accessible ? cfg.badgeOpen.color : cfg.badgeLocked.color, border: isVip ? '0.5px solid #B8860B' : 'none', flexShrink: 0 }}>
                    {accessible ? '開放中' : '等級不足'}
                  </div>
                </div>
                <div style={{ height: '0.5px', margin: '0 16px', background: cfg.divider }} />
                {accessible ? (
                  <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: isVip ? '#555' : '#bbb', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className="fa-solid fa-box-open" style={{ fontSize: 11, color: isVip ? '#B8860B' : '#D4A94A' }}></i>共 {count} 項商品
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

      {/* 點數紀錄 */}
      {showPointsLog && (
        <div onClick={() => setShowPointsLog(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '80vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2D1A00' }}><i className="fa-solid fa-clock-rotate-left" style={{ color: '#E07B00', marginRight: 7 }}></i>點數紀錄</div>
              <span style={{ fontSize: 11, color: '#bbb' }}>{pointsLogs.length} 筆</span>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 32px' }}>
              {pointsLogs.length === 0 ? <div style={{ textAlign: 'center', padding: 32, color: '#bbb', fontSize: 13 }}>尚無紀錄</div>
                : pointsLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: log.points > 0 ? '#EAF3DE' : '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fa-solid ${log.points > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`} style={{ fontSize: 13, color: log.points > 0 ? '#388E3C' : '#E24B4A' }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{log.note || log.type}</div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{new Date(log.created_at).toLocaleDateString('zh-TW')}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: log.points > 0 ? '#388E3C' : '#E24B4A' }}>{log.points > 0 ? '+' : ''}{log.points}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 我的物品 */}
      {showMyItems && (
        <div onClick={() => { setShowMyItems(false); setSelectedIds([]) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '80vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2D1A00' }}><i className="fa-solid fa-box" style={{ color: '#E07B00', marginRight: 7 }}></i>我的物品</div>
              <span style={{ fontSize: 11, color: '#bbb' }}>{pendingOrders.length} 件待出貨</span>
            </div>
            {pendingOrders.length > 0 && (
              <div style={{ padding: '8px 20px', background: '#FFFBF2', borderBottom: '0.5px solid #f5f0e8', fontSize: 11, color: '#BA7517', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <i className="fa-solid fa-circle-info" style={{ fontSize: 11 }}></i>勾選商品後點「申請出貨」
              </div>
            )}
            <div style={{ overflowY: 'auto', padding: '8px 20px 100px', flex: 1 }}>
              {pendingOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 13 }}>
                  <i className="fa-solid fa-box-open" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: 0.3 }}></i>目前沒有待出貨的物品
                </div>
              ) : pendingOrders.map(order => {
                const checked = selectedIds.includes(order.id)
                const isRequested = order.status === 'shipping_requested'
                return (
                  <div key={order.id} onClick={() => !isRequested && toggleSelect(order.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid #f5f0e8', cursor: isRequested ? 'default' : 'pointer' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isRequested ? '#3B82F6' : checked ? '#BA7517' : '#ddd'}`, background: isRequested ? '#EFF6FF' : checked ? '#BA7517' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {(checked || isRequested) && <i className="fa-solid fa-check" style={{ fontSize: 11, color: isRequested ? '#3B82F6' : '#fff' }}></i>}
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '0.5px solid #F5E8C8', background: '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {order.shop_products?.image_url ? <img src={order.shop_products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-gift" style={{ fontSize: 20, color: '#D4A94A', opacity: 0.5 }}></i>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{order.product_name}</div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{new Date(order.created_at).toLocaleDateString('zh-TW')} 兌換</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#E24B4A', marginTop: 1 }}>-{order.points_spent} 點</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: isRequested ? '#EFF6FF' : '#FFF3E0', color: isRequested ? '#3B82F6' : '#E07B00', flexShrink: 0 }}>
                      {isRequested ? '申請中' : '待出貨'}
                    </span>
                  </div>
                )
              })}
            </div>
            {pendingOrders.length > 0 && (
              <div style={{ padding: '12px 20px 24px', borderTop: '0.5px solid #f5f0e8', background: '#fff', flexShrink: 0 }}>
                {requestSuccess && (
                  <div style={{ background: '#EAF3DE', border: '0.5px solid #86C566', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#388E3C', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-solid fa-circle-check"></i> 申請成功！後台將盡快安排出貨
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>{selectedIds.length > 0 ? `已選 ${selectedIds.length} 件` : '請勾選要出貨的商品'}</span>
                  <span onClick={() => {
                    const selectable = pendingOrders.filter(o => o.status === 'pending').map(o => o.id)
                    setSelectedIds(selectedIds.length === selectable.length ? [] : selectable)
                  }} style={{ fontSize: 11, color: '#BA7517', cursor: 'pointer', fontWeight: 600 }}>
                    {selectedIds.length === pendingOrders.filter(o => o.status === 'pending').length ? '取消全選' : '全選'}
                  </span>
                </div>
                <button onClick={handleRequestShipping} disabled={selectedIds.length === 0 || requesting}
                  style={{ width: '100%', padding: 13, background: selectedIds.length === 0 || requesting ? '#ccc' : 'linear-gradient(135deg,#BA7517,#D4A94A)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <i className="fa-solid fa-truck"></i>
                  {requesting ? '申請中...' : `申請出貨${selectedIds.length > 0 ? `（${selectedIds.length} 件）` : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 出貨紀錄 */}
      {showShipped && (
        <div onClick={() => setShowShipped(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '80vh', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#f0e8d0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 8px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2D1A00' }}><i className="fa-solid fa-truck" style={{ color: '#388E3C', marginRight: 7 }}></i>出貨紀錄</div>
              <span style={{ fontSize: 11, color: '#bbb' }}>{shippedOrders.length} 筆</span>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 32px' }}>
              {shippedOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 13 }}>
                  <i className="fa-solid fa-truck" style={{ fontSize: 32, display: 'block', marginBottom: 10, opacity: 0.2 }}></i>尚無出貨紀錄
                </div>
              ) : shippedOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '0.5px solid #F5E8C8', background: '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {order.shop_products?.image_url ? <img src={order.shop_products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-gift" style={{ fontSize: 20, color: '#D4A94A', opacity: 0.5 }}></i>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{order.product_name}</div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{order.shipped_at ? `${new Date(order.shipped_at).toLocaleDateString('zh-TW')} 出貨` : '已出貨'}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#E24B4A', marginTop: 1 }}>-{order.points_spent} 點</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: '#EAF3DE', color: '#388E3C', flexShrink: 0 }}>已出貨</span>
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
