// src/pages/ShopPage.js
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSearchParams } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

const TIER_CONFIG = {
  general: {
    key: 'general', name: '一般點數商城', icon: 'fa-solid fa-store', iconColor: '#E07B00',
    cardBg: '#fff', cardBorder: '#F5E8C8', iconBg: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)',
    badgeOpen: { bg: '#FFF3E0', color: '#E07B00' }, badgeLocked: { bg: '#f5f5f5', color: '#bbb' },
    lockColor: '#CBD5E1', lockTextColor: '#94A3B8', divider: '#F5E8C8', enterColor: '#E07B00',
    allowedLevels: ['精靈球', '超級球', '高級球', '豪華球', '貴重球', '究極球', '大師球'], lockMsg: '所有會員皆可進入',
  },
  premium: {
    key: 'premium', name: '高級點數商城', icon: 'fa-solid fa-gem', iconColor: '#3B82F6',
    cardBg: '#fff', cardBorder: '#CBD5E1', iconBg: 'linear-gradient(135deg,#E8EFF6,#CBD5E1)',
    badgeOpen: { bg: '#EFF6FF', color: '#3B82F6' }, badgeLocked: { bg: '#EFF6FF', color: '#3B82F6' },
    lockColor: '#CBD5E1', lockTextColor: '#94A3B8', divider: '#E2E8F0', enterColor: '#3B82F6',
    allowedLevels: ['高級球', '豪華球', '貴重球', '究極球', '大師球'], lockMsg: '升至高級球以上即可進入',
  },
  vip: {
    key: 'vip', name: 'VIP 點數商城', icon: 'fa-solid fa-crown', iconColor: '#F5D060',
    cardBg: '#1A1A1A', cardBorder: '#B8860B', iconBg: '#2A2A1A',
    badgeOpen: { bg: '#2A2200', color: '#F5D060' }, badgeLocked: { bg: '#2A2200', color: '#F5D060' },
    lockColor: '#B8860B', lockTextColor: '#666', divider: '#B8860B44', enterColor: '#F5D060',
    allowedLevels: ['大師球'], lockMsg: '僅大師球會員可進入',
  },
}

const PRODUCT_TAG_CONFIG = {
  擴充盒: { icon: 'fa-box', color: '#E24B4A', bg: '#FCEBEB', border: '#F09595' },
  散包: { icon: 'fa-layer-group', color: '#E07B00', bg: '#FFF3E0', border: '#FAC775' },
  其他: { icon: 'fa-tag', color: '#666', bg: '#F5F5F5', border: '#E0E0E0' },
}

function ProductTag({ tag }) {
  const label = tag || '其他'
  const cfg = PRODUCT_TAG_CONFIG[label] || PRODUCT_TAG_CONFIG['其他']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `0.5px solid ${cfg.border}`, borderRadius: 99, padding: '2px 7px', lineHeight: 1.3 }}>
      <i className={`fa-solid ${cfg.icon}`} style={{ fontSize: 8 }}></i>
      {label}
    </span>
  )
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

function AccessTag({ tier }) {
  if (tier === 'general') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '3px 8px', borderRadius: 99, background: '#FFFBF2', color: '#BA7517', border: '0.5px solid #F5E8C8' }}>所有會員</span>
  )
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

function OrderSuccessOverlay({ order, onClose }) {
  const COLORS = ['#E24B4A','#BA7517','#378ADD','#7038F8','#FAC775','#78C850']
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    color: COLORS[i % COLORS.length], x: 5 + Math.random() * 90,
    delay: Math.random() * 0.4, dur: 0.7 + Math.random() * 0.5, size: 5 + Math.random() * 5,
  }))
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes orderConfetti{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(260px) rotate(540deg);opacity:0}}
        @keyframes orderPop{0%{transform:scale(0.7) translateY(20px);opacity:0}70%{transform:scale(1.04);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes liveBadgePulse{0%,100%{opacity:1}50%{opacity:0.6}}
      `}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {pieces.map((p, i) => (
          <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: '-8px', width: p.size, height: p.size, borderRadius: 2, background: p.color, animation: `orderConfetti ${p.dur}s ${p.delay}s ease-in both` }} />
        ))}
      </div>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 24px 22px', maxWidth: 310, width: '88%', textAlign: 'center', boxShadow: '0 16px 48px rgba(0,0,0,.25)', animation: 'orderPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg,#E24B4A,#c0392b)', borderRadius: 99, padding: '4px 12px', marginBottom: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'liveBadgePulse 1s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.08em' }}>下單成功</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', marginBottom: 4, letterSpacing: '-0.5px' }}>
          #{String(order.order_no).padStart(4, '0')}
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginBottom: 18 }}>訂單編號已記錄</div>
        <div style={{ background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: 12, padding: '12px 14px', marginBottom: 18, textAlign: 'left' }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#333', marginBottom: i < order.items.length - 1 ? 8 : 0 }}>
              <div>
                <span style={{ fontWeight: 500 }}>{item.item_name}</span>
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: item.dine_type === 'dine_in' ? '#FCEBEB' : '#F5F5F5', color: item.dine_type === 'dine_in' ? '#A32D2D' : '#555' }}>
                  {item.dine_type === 'dine_in' ? '內用' : '外帶'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#bbb' }}>× {item.quantity}</span>
                <span style={{ fontWeight: 700, color: '#1a1a1a' }}>$ {item.subtotal}</span>
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: '#EBEBEB', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>
            <span>合計</span>
            <span style={{ color: '#E24B4A' }}>$ {order.total_amount}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#1a1a1a,#333)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.03em' }}>
          確認
        </button>
      </div>
    </div>
  )
}

const LOG_TYPE_LABEL = {
  login: '每日登入',
  streak_bonus: '7日全勤獎勵',
  makeup: '補簽（積分扣除）',
  purchase: '兌換商品',
  shop_purchase: '點數商城兌換',
  admin: '管理員調整',
  event: '活動獎勵',
}

const ORDER_STATUS = {
  pending:    { label: '待處理', color: '#E07B00', bg: '#FFF3E0' },
  processing: { label: '處理中', color: '#3B82F6', bg: '#EFF6FF' },
  shipped:    { label: '已完成', color: '#7C3AED', bg: '#F5F3FF' },
  completed:  { label: '已完成', color: '#16A34A', bg: '#F0FFF4' },
  cancelled:  { label: '已取消', color: '#999',    bg: '#F5F5F5' },
}

export default function ShopPage() {
  const { member, setMember } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [mainTab, setMainTab] = useState(searchParams.get('tab') === 'shop' ? 'shop' : 'live')

  const [products, setProducts] = useState([])
  // BUG FIX #1: 改用正確的 point_logs 表（原本錯誤使用 points_logs）
  const [pointsLogs, setPointsLogs] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [shippedOrders, setShippedOrders] = useState([])
  const [purchasedCounts, setPurchasedCounts] = useState({})
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

  const [liveItems, setLiveItems] = useState([])
  const [liveTagFilter, setLiveTagFilter] = useState('全部')
  const [liveLoading, setLiveLoading] = useState(false)
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [cartFading, setCartFading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [myOrders, setMyOrders] = useState([])
  const [showMyOrders, setShowMyOrders] = useState(false)

  useEffect(() => {
    if (member) { fetchShopData(); fetchLiveData() }
  }, [member])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'shop') setMainTab('shop')
    else if (tab === 'live' || tab === 'menu') setMainTab('live')
  }, [searchParams])

  // BUG FIX #3: Realtime 訂閱已在 Supabase Dashboard 對 menu_orders 開啟
  useEffect(() => {
    if (!member) return
    const channel = supabase
      .channel('menu_orders_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'menu_orders',
        filter: `member_id=eq.${member.id}`,
      }, () => { fetchLiveData() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [member])

  async function fetchShopData() {
    setLoading(true)
    const [{ data: prods, error: pe }, { data: logs }, { data: allOrders }] = await Promise.all([
      supabase.from('shop_products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      // BUG FIX #1: 從 points_logs（舊表/錯誤）改為 point_logs（正確表）
      supabase.from('point_logs').select('*').eq('member_id', member.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('shop_orders').select('*, shop_products(name, image_url)').eq('member_id', member.id).order('created_at', { ascending: false }).limit(200),
    ])
    setProductsError(pe)
    setProducts(prods || [])
    setPointsLogs(logs || [])
    const all = allOrders || []
    setPendingOrders(all.filter(o => o.status === 'pending' || o.status === 'shipping_requested'))
    setShippedOrders(all.filter(o => o.status === 'shipped'))
    const counts = {}
    all.filter(o => o.status !== 'cancelled').forEach(o => { counts[o.product_id] = (counts[o.product_id] || 0) + 1 })
    setPurchasedCounts(counts)
    setLoading(false)
  }

  async function fetchLiveData() {
    setLiveLoading(true)
    const [{ data: items }, { data: orders }] = await Promise.all([
      supabase.from('menu_items').select('*').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('menu_orders').select('*, menu_order_items(*)').eq('member_id', member.id).order('created_at', { ascending: false }).limit(20),
    ])
    setLiveItems(items || [])
    setMyOrders(orders || [])
    setLiveLoading(false)
  }

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      if (existing) {
        if (existing.quantity >= item.stock) return prev
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { item, quantity: 1, dine_type: 'dine_in' }]
    })
  }

  function updateCartQty(itemId, delta) {
    setCart(prev => prev.map(c => {
      if (c.item.id !== itemId) return c
      const newQty = c.quantity + delta
      if (newQty <= 0) return null
      if (newQty > c.item.stock) return c
      return { ...c, quantity: newQty }
    }).filter(Boolean))
  }

  function updateCartDineType(itemId, dineType) {
    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, dine_type: dineType } : c))
  }

  function removeFromCart(itemId) {
    setCart(prev => prev.filter(c => c.item.id !== itemId))
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)
  const filteredLiveItems = liveTagFilter === '全部'
    ? liveItems
    : liveItems.filter(item => (item.product_tag || '其他') === liveTagFilter)

  function closeCart() {
    setCartFading(true)
    setTimeout(() => { setShowCart(false); setCartFading(false) }, 250)
  }

  async function handleCheckout() {
    if (cart.length === 0 || !member) return
    setCheckingOut(true)
    try {
      const p_items = cart.map(c => ({
        item_id: c.item.id,
        item_name: c.item.name,
        item_price: c.item.price,
        quantity: c.quantity,
        dine_type: c.dine_type,
      }))
      const { data: result, error: rpcErr } = await supabase.rpc('checkout_menu_order', {
        p_member_id: member.id,
        p_items: p_items,
      })
      if (rpcErr) throw rpcErr

      const successData = {
        order_no: result.order_no,
        total_amount: result.total_amount,
        items: cart.map(c => ({
          item_name: c.item.name,
          quantity: c.quantity,
          subtotal: c.item.price * c.quantity,
          dine_type: c.dine_type,
        })),
      }
      setCart([])
      closeCart()
      setOrderSuccess(successData)
      await fetchLiveData()
    } catch (err) {
      alert('下單失敗：' + err.message)
    }
    setCheckingOut(false)
  }

  function openConfirm(prod) { setConfirmProduct(prod); setConfirmQty(1) }
  function remainingAllowance(prod) {
    const max = prod.max_per_member || 1
    const bought = purchasedCounts[prod.id] || 0
    return Math.max(0, max - bought)
  }
  async function handleBuy() {
    if (!confirmProduct || !member) return
    const totalCost = confirmProduct.price * confirmQty
    if (member.shop_points < totalCost) return
    setBuying(true)
    try {
      const { data, error } = await supabase.rpc('purchase_shop_product', { p_product_id: confirmProduct.id, p_quantity: confirmQty })
      if (error) throw error
      setMember({ ...member, shop_points: data.shop_points })
      setSuccessProduct(confirmProduct); setSuccessQty(confirmQty)
      setConfirmProduct(null); await fetchShopData()
    } catch (err) { alert('兌換失敗：' + err.message) }
    setBuying(false)
  }
  async function handleRequestShipping() {
    if (selectedIds.length === 0) return
    setRequesting(true)
    try {
      const { error } = await supabase.rpc('request_shop_order_shipping', { p_order_ids: selectedIds })
      if (error) throw error
      setSelectedIds([]); setRequestSuccess(true)
      await fetchShopData()
      setTimeout(() => setRequestSuccess(false), 3000)
    } catch (err) { alert('申請失敗：' + err.message) }
    setRequesting(false)
  }
  function toggleSelect(id) { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]) }

  if (!member) return null

  const tierProducts = (tier) => products.filter(p => p.tier === tier)
  const S = { page: { maxWidth: 390, margin: '0 auto', background: '#FFFBF2', minHeight: '100vh', display: 'flex', flexDirection: 'column' } }

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
                        <div style={{ fontSize: 12, fontWeight: 600, color: isVip ? '#E8D5A0' : '#2D1A00', marginBottom: 4, lineHeight: 1.35 }}>{prod.name}</div>
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
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2D1A00', marginBottom: 4, lineHeight: 1.35 }}>{confirmProduct.name}</div>
                      {confirmProduct.description && <div style={{ fontSize: 11, color: '#bbb', marginBottom: 6 }}>{confirmProduct.description}</div>}
                      <div style={{ fontSize: 12, color: '#E07B00', fontWeight: 700 }}><i className="fa-solid fa-coins" style={{ fontSize: 10, marginRight: 3 }}></i>{confirmProduct.price} 點 / 個</div>
                    </div>
                  </div>
                  {maxQty > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f5f0', borderRadius: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 13, color: '#666' }}>兌換數量</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => setConfirmQty(q => Math.max(1, q - 1))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #f0e8d0', background: '#fff', fontSize: 16, color: '#BA7517', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#2D1A00', minWidth: 24, textAlign: 'center' }}>{confirmQty}</span>
                        <button onClick={() => setConfirmQty(q => Math.min(maxQty, q + 1))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #f0e8d0', background: '#fff', fontSize: 16, color: '#BA7517', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>＋</button>
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
                      <span style={{ fontWeight: 800, color: canAfford ? '#E07B00' : '#E24B4A' }}>{((member.shop_points || 0) - totalCost).toLocaleString()} 點</span>
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

  return (
    <div style={S.page}>
      <style>{`
        @keyframes liveDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.7)}}
        @keyframes liveGlow{0%,100%{box-shadow:0 0 0 0 rgba(226,75,74,0.4)}50%{box-shadow:0 0 0 6px rgba(226,75,74,0)}}
        @keyframes slideInItem{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)', padding: '18px 20px 0', borderBottom: '0.5px solid #F5E8C8' }}>
          <div style={{ fontSize: 9, color: '#BA7517', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.6, marginBottom: 8 }}>W/NA PTCG × HUGO COLLECTIONS</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              {mainTab === 'live' ? (
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.3px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E24B4A', borderRadius: 6, padding: '3px 8px', animation: 'liveGlow 2s ease infinite' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'liveDot 1s ease infinite' }} />
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>LIVE</span>
                  </div>
                  直播下單區
                </div>
              ) : (
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2D1A00', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className="fa-solid fa-store" style={{ fontSize: 15, color: '#E07B00' }}></i>點數商城
                </div>
              )}
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>
                {mainTab === 'live' ? '選擇直播商品，立即下單' : '使用點數兌換專屬好禮'}
              </div>
            </div>
            {mainTab === 'shop' && (
              <div style={{ background: '#fff', border: '1.5px solid #FAC775', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#E07B00' }}>{(member.shop_points || 0).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: '#bbb', marginTop: 1 }}>可用點數</div>
              </div>
            )}
            {mainTab === 'live' && (
              <button onClick={() => setShowMyOrders(true)}
                style={{ background: '#fff', border: '1.5px solid #E0E0E0', borderRadius: 12, padding: '8px 14px', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="fa-solid fa-receipt" style={{ fontSize: 14, color: '#555' }}></i>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>我的訂單</div>
                  <div style={{ fontSize: 9, color: '#bbb' }}>{myOrders.length} 筆</div>
                </div>
              </button>
            )}
          </div>

          {/* Tab */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid #F5E8C8' }}>
            {[
              { key: 'live', label: '直播下單區', icon: 'fa-video',  activeColor: '#E24B4A', activeBg: 'rgba(226,75,74,0.06)' },
              { key: 'shop', label: '點數商城',       icon: 'fa-store',  activeColor: '#E07B00', activeBg: 'rgba(224,123,0,0.04)' },
            ].map(t => (
              <button key={t.key}
                onClick={() => { setMainTab(t.key); setSearchParams(t.key === 'shop' ? { tab: 'shop' } : {}) }}
                style={{ flex: 1, padding: '10px 0', border: 'none', background: mainTab === t.key ? t.activeBg : 'transparent', fontSize: 13, fontWeight: mainTab === t.key ? 700 : 400, color: mainTab === t.key ? t.activeColor : '#bbb', cursor: 'pointer', borderBottom: mainTab === t.key ? `2.5px solid ${t.activeColor}` : '2.5px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
                <i className={`fa-solid ${t.icon}`} style={{ fontSize: 12 }}></i>
                {t.label}
                {t.key === 'live' && liveItems.length > 0 && mainTab !== 'live' && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E24B4A', display: 'inline-block', animation: 'liveDot 1s ease infinite' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {mainTab === 'live' && (
          <div style={{ padding: '12px 16px 0' }}>
            
              href="https://www.hugocollections.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(226,75,74,0.35)', background: 'linear-gradient(135deg,#1a1a1a,#2A2A2A)', color: '#fff', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,0.12)', textDecoration: 'none' }}
            >
              <i className="fa-solid fa-credit-card" style={{ fontSize: 13, color: '#E24B4A' }}></i>
              我要刷卡
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 10, color: '#888' }}></i>
            </a>
          </div>
        )}

        {mainTab === 'live' && !liveLoading && liveItems.length > 0 && (
          <div style={{ padding: '10px 16px 0', display: 'flex', gap: 7, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {['全部', '擴充盒', '散包', '其他'].map(tag => {
              const active = liveTagFilter === tag
              const count = tag === '全部' ? liveItems.length : liveItems.filter(item => (item.product_tag || '其他') === tag).length
              return (
                <button key={tag} onClick={() => setLiveTagFilter(tag)}
                  style={{ flexShrink: 0, border: `1px solid ${active ? '#E24B4A' : '#E8E8E8'}`, background: active ? '#FCEBEB' : '#fff', color: active ? '#E24B4A' : '#777', borderRadius: 99, padding: '6px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {tag !== '全部' && <i className={`fa-solid ${PRODUCT_TAG_CONFIG[tag]?.icon || 'fa-tag'}`} style={{ fontSize: 9 }}></i>}
                  {tag}
                  <span style={{ fontSize: 9, opacity: 0.7 }}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* 直播下單區 */}
        {mainTab === 'live' && (
          <div style={{ padding: '0 0 120px' }}>
            {liveLoading ? (
              <>
                <style>{`@keyframes sk{0%{background-position:-300px 0}100%{background-position:300px 0}}`}</style>
                <div style={{ padding: '12px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ borderRadius: 14, overflow: 'hidden', border: '0.5px solid #F0F0F0' }}>
                      <div style={{ aspectRatio: '1', background: 'linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)', backgroundSize: '600px', animation: 'sk 1.4s ease infinite' }} />
                      <div style={{ padding: '10px 10px 12px', background: '#fff' }}>
                        <div style={{ height: 10, width: '70%', borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)', backgroundSize: '600px', animation: 'sk 1.4s ease infinite', marginBottom: 6 }} />
                        <div style={{ height: 9, width: '45%', borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)', backgroundSize: '600px', animation: 'sk 1.4s ease infinite' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : liveItems.length === 0 ? (
              <div style={{ padding: '72px 32px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <i className="fa-solid fa-video-slash" style={{ fontSize: 28, color: '#BDBDBD' }}></i>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 6 }}>目前尚未有上架商品</div>
                <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6 }}>商品上架後即可在此下單<br/>請關注直播通知</div>
              </div>
            ) : filteredLiveItems.length === 0 ? (
              <div style={{ padding: '56px 32px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: 24, color: '#BDBDBD' }}></i>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>此分類暫無商品</div>
                <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6 }}>可以切換其他標籤查看</div>
              </div>
            ) : (
              <div style={{ padding: '12px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {filteredLiveItems.map((item, idx) => {
                  const soldOut = item.stock <= 0
                  const cartItem = cart.find(c => c.item.id === item.id)
                  const cartQty = cartItem ? cartItem.quantity : 0
                  return (
                    <div key={item.id}
                      style={{ background: '#fff', border: `1px solid ${soldOut ? '#EEEEEE' : '#E8E8E8'}`, borderRadius: 14, overflow: 'hidden', opacity: soldOut ? 0.55 : 1, boxShadow: soldOut ? 'none' : '0 2px 12px rgba(0,0,0,0.06)', animation: `slideInItem 0.3s ${idx * 0.05}s ease both` }}>
                      <div style={{ aspectRatio: '1', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                        {item.image_url
                          ? <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                          : null}
                        <i className="fa-solid fa-box-open" style={{ fontSize: 32, color: '#BDBDBD', display: item.image_url ? 'none' : 'block' }}></i>
                        <div style={{ position: 'absolute', top: 7, left: 7 }}>
                          <ProductTag tag={item.product_tag} />
                        </div>
                        {soldOut && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ background: '#1a1a1a', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 99 }}>已售完</div>
                          </div>
                        )}
                        {!soldOut && item.stock <= 5 && (
                          <div style={{ position: 'absolute', top: 7, right: 7, background: '#E24B4A', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>僅剩 {item.stock}</div>
                        )}
                        {!soldOut && item.stock > 5 && (
                          <div style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 9, padding: '2px 7px', borderRadius: 99 }}>剩 {item.stock}</div>
                        )}
                      </div>
                      <div style={{ padding: '10px 10px 12px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 2, lineHeight: 1.4 }}>{item.name}</div>
                        {item.description && <div style={{ fontSize: 10, color: '#9E9E9E', marginBottom: 6, lineHeight: 1.4 }}>{item.description}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#E24B4A', letterSpacing: '-0.3px' }}>$ {item.price}</div>
                          {!soldOut && (
                            cartQty > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#F5F5F5', borderRadius: 99, overflow: 'hidden' }}>
                                <button onClick={() => updateCartQty(item.id, -1)} style={{ width: 28, height: 28, border: 'none', background: 'transparent', fontSize: 16, color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                                <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', minWidth: 22, textAlign: 'center' }}>{cartQty}</span>
                                <button onClick={() => addToCart(item)} style={{ width: 28, height: 28, border: 'none', background: '#1a1a1a', fontSize: 16, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>＋</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item)} style={{ padding: '6px 14px', background: '#1a1a1a', border: 'none', borderRadius: 99, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '0.02em' }}>
                                + 加入
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 商城 Tab */}
        {mainTab === 'shop' && (
          <>
            <div style={{ padding: '14px 16px 10px' }}>
              {/* BUG FIX #2: 移除永遠顯示「計算中」的「即將到期」欄位，改為本月收支兩欄 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {[
                  { label: '本月獲得', icon: 'fa-arrow-up', iconColor: '#78C850', value: `+${pointsLogs.filter(l => l.points > 0 && new Date(l.created_at).getMonth() === new Date().getMonth() && new Date(l.created_at).getFullYear() === new Date().getFullYear()).reduce((s, l) => s + l.points, 0)} 點` },
                  { label: '本月使用', icon: 'fa-arrow-down', iconColor: '#E24B4A', value: `-${Math.abs(pointsLogs.filter(l => l.points < 0 && new Date(l.created_at).getMonth() === new Date().getMonth() && new Date(l.created_at).getFullYear() === new Date().getFullYear()).reduce((s, l) => s + l.points, 0))} 點` },
                  { label: '累計點數', icon: 'fa-coins', iconColor: '#BA7517', value: `${(member.shop_points || 0).toLocaleString()} 點` },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: '#fff', border: '0.5px solid #F5E8C8', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className={`fa-solid fa-${s.icon}`} style={{ fontSize: 9, color: s.iconColor }}></i>{s.label}
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
            <div style={{ padding: '0 16px 4px', fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-circle-info" style={{ color: '#E07B00' }}></i>
              你的等級：{member.level} · 目前可進入{canAccess(member.level, 'vip') ? 'VIP 點數商城' : canAccess(member.level, 'premium') ? '高級點數商城' : '一般點數商城'}
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
                        <div style={{ marginTop: 6 }}><AccessTag tier={tier} /></div>
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
                          進入點數商城 <i className="fa-solid fa-chevron-right" style={{ fontSize: 10 }}></i>
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
          </>
        )}
      </div>

      {/* 購物車固定按鈕 */}
      {mainTab === 'live' && cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 390, padding: '0 16px', zIndex: 50 }}>
          <button onClick={() => setShowCart(true)}
            style={{ width: '100%', padding: '14px 20px', background: '#1a1a1a', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 6px 24px rgba(0,0,0,.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-cart-shopping" style={{ fontSize: 16 }}></i>
                <span style={{ position: 'absolute', top: -6, right: -8, background: '#E24B4A', color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 900, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>{cartCount}</span>
              </div>
              <span>查看購物車</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 900 }}>$ {cartTotal}</span>
          </button>
        </div>
      )}

      {/* 購物車 Sheet */}
      {showCart && (
        <div onClick={closeCart} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transition: 'opacity 0.25s', opacity: cartFading ? 0 : 1 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '90vh', background: '#fff', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', transition: 'transform 0.25s', transform: cartFading ? 'translateY(100%)' : 'translateY(0)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 10px', borderBottom: '0.5px solid #F0F0F0', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-cart-shopping" style={{ fontSize: 15 }}></i>購物車
                <span style={{ fontSize: 12, fontWeight: 500, color: '#9E9E9E', marginLeft: 2 }}>{cartCount} 件</span>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px' }}>
              {cart.map(c => (
                <div key={c.item.id} style={{ padding: '14px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.item.image_url ? <img src={c.item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-box-open" style={{ fontSize: 18, color: '#BDBDBD' }}></i>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.item.name}</div>
                      <div style={{ fontSize: 13, color: '#E24B4A', fontWeight: 800, marginTop: 2 }}>$ {c.item.price}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#F5F5F5', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                      <button onClick={() => updateCartQty(c.item.id, -1)} style={{ width: 30, height: 30, border: 'none', background: 'transparent', fontSize: 16, color: '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a', minWidth: 24, textAlign: 'center' }}>{c.quantity}</span>
                      <button onClick={() => updateCartQty(c.item.id, 1)} style={{ width: 30, height: 30, border: 'none', background: '#1a1a1a', fontSize: 16, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>＋</button>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 48, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>$ {c.item.price * c.quantity}</div>
                      <button onClick={() => removeFromCart(c.item.id)} style={{ fontSize: 10, color: '#BDBDBD', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 3 }}>移除</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { key: 'dine_in',  label: '內用', sub: '直播現場拆', icon: 'fa-users',   activeColor: '#E24B4A', activeBorder: '#E24B4A', activeBg: '#FCEBEB', activeText: '#A32D2D', activeSub: '#A32D2D' },
                      { key: 'takeout',  label: '外帶', sub: '未拆封寄出', icon: 'fa-box',     activeColor: '#1a1a1a', activeBorder: '#1a1a1a', activeBg: '#F5F5F5', activeText: '#1a1a1a', activeSub: '#555' },
                    ].map(opt => {
                      const active = c.dine_type === opt.key
                      return (
                        <button key={opt.key} onClick={() => updateCartDineType(c.item.id, opt.key)}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 9, border: `${active ? '1.5px' : '0.5px'} solid ${active ? opt.activeBorder : '#E8E8E8'}`, background: active ? opt.activeBg : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                          <i className={`fa-solid ${opt.icon}`} style={{ fontSize: 12, color: active ? opt.activeColor : '#BDBDBD' }}></i>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: active ? opt.activeText : '#9E9E9E', lineHeight: 1.2 }}>{opt.label}</div>
                            <div style={{ fontSize: 10, color: active ? opt.activeSub : '#BDBDBD', lineHeight: 1.2 }}>{opt.sub}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 20px 28px', borderTop: '0.5px solid #F0F0F0', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: '#9E9E9E' }}>訂單總計</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#E24B4A', letterSpacing: '-0.5px' }}>$ {cartTotal}</span>
              </div>
              <button onClick={handleCheckout} disabled={checkingOut || cart.length === 0}
                style={{ width: '100%', padding: 15, background: checkingOut ? '#ccc' : '#1a1a1a', border: 'none', borderRadius: 13, fontSize: 15, fontWeight: 800, color: '#fff', cursor: checkingOut ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.02em' }}>
                {checkingOut ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                      <path d="M8 2 A6 6 0 0 1 14 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    送出中...
                  </>
                ) : (
                  <><i className="fa-solid fa-bolt" style={{ fontSize: 13 }}></i>立即下單</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 我的訂單 Sheet */}
      {showMyOrders && (
        <div onClick={() => setShowMyOrders(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 390, maxHeight: '85vh', background: '#fff', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0', margin: '12px auto 0', flexShrink: 0 }} />
            <div style={{ padding: '12px 20px 10px', borderBottom: '0.5px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>
                <i className="fa-solid fa-receipt" style={{ marginRight: 8, color: '#555' }}></i>我的訂單
              </div>
              <span style={{ fontSize: 11, color: '#bbb' }}>{myOrders.length} 筆</span>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 20px 32px' }}>
              {myOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb' }}>
                  <i className="fa-solid fa-receipt" style={{ fontSize: 36, display: 'block', marginBottom: 12, opacity: 0.25 }}></i>
                  <div style={{ fontSize: 13 }}>尚無訂單紀錄</div>
                </div>
              ) : myOrders.map(order => {
                const sc = ORDER_STATUS[order.status] || ORDER_STATUS.pending
                return (
                  <div key={order.id} style={{ padding: '14px 0', borderBottom: '0.5px solid #F5F5F5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1a' }}>#{String(order.order_no).padStart(4, '0')}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </div>
                    {(order.menu_order_items || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#555', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>{item.item_name} × {item.quantity}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: item.dine_type === 'dine_in' ? '#FCEBEB' : '#F5F5F5', color: item.dine_type === 'dine_in' ? '#A32D2D' : '#555' }}>
                            {item.dine_type === 'dine_in' ? '內用' : '外帶'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 600 }}>$ {item.subtotal}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '0.5px solid #F5F5F5' }}>
                      <span style={{ fontSize: 10, color: '#bbb' }}>{new Date(order.created_at).toLocaleDateString('zh-TW')} {new Date(order.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#E24B4A' }}>$ {order.total_amount}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {orderSuccess && <OrderSuccessOverlay order={orderSuccess} onClose={() => setOrderSuccess(null)} />}

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
              {pointsLogs.length === 0 ? <div style={{ textAlign: 'center', padding: 32, color: '#bbb', fontSize: 13 }}>尚無紀錄</div>
                : pointsLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: log.points > 0 ? '#EAF3DE' : '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fa-solid ${log.points > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`} style={{ fontSize: 13, color: log.points > 0 ? '#388E3C' : '#E24B4A' }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{log.note || LOG_TYPE_LABEL[log.type] || log.type}</div>
                      {log.type === 'makeup' && (
                        <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>扣除積分，非商城點數</div>
                      )}
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{new Date(log.created_at).toLocaleDateString('zh-TW')}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: log.points > 0 ? '#388E3C' : '#E24B4A' }}>{log.points > 0 ? '+' : ''}{log.points}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 我的物品 Sheet */}
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
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isRequested ? '#3B82F6' : checked ? '#BA7517' : '#ddd'}`, background: isRequested ? '#EFF6FF' : checked ? '#BA7517' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

      {/* 出貨紀錄 Sheet */}
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
