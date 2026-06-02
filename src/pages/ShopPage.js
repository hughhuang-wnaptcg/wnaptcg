import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// ─── 假資料（實際請串接 API） ────────────────────────────────────────────────
const TODAY_PRODUCTS = [
  {
    id: 't1',
    name: 'SV 黑焰支配者 補充包',
    desc: '每包 10 張，隨機出貨',
    price: 150,
    stock: 12,
    image: '/images/products/sv-booster.jpg',
    source: 'today',
  },
  {
    id: 't2',
    name: 'ex 特選系列 卡盒',
    desc: '36包入，含限定卡保護',
    price: 1800,
    stock: 3,
    image: '/images/products/ex-box.jpg',
    source: 'today',
  },
  {
    id: 't3',
    name: '閃光寶可夢 單卡包',
    desc: '保底閃光 1 張',
    price: 300,
    stock: 0,
    image: '/images/products/shiny-pack.jpg',
    source: 'today',
  },
]

const SHOP_TIERS = [
  { key: 'normal', label: '一般商城' },
  { key: 'premium', label: '高級商城' },
  { key: 'vip', label: 'VIP 商城' },
]

const SHOP_PRODUCTS = {
  normal: [
    { id: 's1', name: '基礎補充包', points: 50, stock: 99, image: '/images/products/basic-pack.jpg' },
    { id: 's2', name: '入門卡套組', points: 120, stock: 20, image: '/images/products/starter.jpg' },
  ],
  premium: [
    { id: 's3', name: '高級閃光包', points: 300, stock: 8, image: '/images/products/premium-pack.jpg' },
  ],
  vip: [
    { id: 's4', name: 'VIP 限定盒', points: 800, stock: 2, image: '/images/products/vip-box.jpg' },
  ],
}

const SHOP_SUBMENU = [
  { key: 'products', label: '商品兌換' },
  { key: 'myitems', label: '我的物品' },
  { key: 'shipping', label: '出貨申請' },
  { key: 'history', label: '點數紀錄' },
]

// ─── 元件 ───────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  // 主 Tab：today | shop
  const [activeTab, setActiveTab] = useState(tabParam === 'shop' ? 'shop' : 'today')

  // 商城子 Tab
  const [shopTier, setShopTier] = useState('normal')
  const [shopSub, setShopSub] = useState('products')

  // 購物車（今日商品 + 商城共用）
  const [cart, setCart] = useState([]) // { id, name, price, points, qty, liveOpen, source }
  const [cartOpen, setCartOpen] = useState(false)

  // 加入購物車 modal（今日商品）
  const [addModal, setAddModal] = useState(null) // { product } | null
  const [liveOpenChoice, setLiveOpenChoice] = useState('direct') // 'live' | 'direct'
  const [addQty, setAddQty] = useState(1)

  // 訂單列表（今日商品）
  const [myOrders, setMyOrders] = useState([])

  // 結帳 modal
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // ── URL 同步 ──
  useEffect(() => {
    const t = searchParams.get('tab')
    if (t === 'shop') setActiveTab('shop')
    else if (t === 'today') setActiveTab('today')
  }, [searchParams])

  const switchTab = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // ── 購物車操作 ──
  const openAddModal = (product) => {
    setAddModal({ product })
    setLiveOpenChoice('direct')
    setAddQty(1)
  }
  const closeAddModal = () => setAddModal(null)

  const confirmAddToCart = () => {
    if (!addModal) return
    const { product } = addModal
    setCart((prev) => {
      const key = `${product.id}_${liveOpenChoice}`
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) => i.key === key ? { ...i, qty: i.qty + addQty } : i)
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          price: product.price,
          qty: addQty,
          liveOpen: liveOpenChoice === 'live',
          source: product.source,
        },
      ]
    })
    closeAddModal()
    setCartOpen(true)
  }

  const addShopToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { key: product.id, id: product.id, name: product.name, points: product.points, qty: 1, source: 'shop' }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (key) => setCart((prev) => prev.filter((i) => i.key !== key))
  const changeQty = (key, delta) => {
    setCart((prev) =>
      prev.map((i) => i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    )
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const handleCheckout = () => {
    const newOrders = cart
      .filter((i) => i.source === 'today')
      .map((i) => ({
        id: Date.now() + Math.random(),
        name: i.name,
        qty: i.qty,
        price: i.price,
        liveOpen: i.liveOpen,
        status: '待確認',
        createdAt: new Date().toLocaleString('zh-TW'),
      }))
    setMyOrders((prev) => [...newOrders, ...prev])
    setCart([])
    setCheckoutOpen(false)
    setCartOpen(false)
    alert('訂單已送出！')
  }

  // ── 今日商品 Tab ──
  const renderTodayTab = () => (
    <div className="today-products">
      <div className="section-header">
        <h2 className="section-title">今日商品</h2>
        <p className="section-desc">每日限量上架，售完為止</p>
      </div>

      <div className="product-grid">
        {TODAY_PRODUCTS.map((p) => (
          <div key={p.id} className={`product-card ${p.stock === 0 ? 'sold-out' : ''}`}>
            <div className="card-img-wrap">
              <img src={p.image} alt={p.name} onError={(e) => { e.target.style.display = 'none' }} />
              {p.stock === 0 && <div className="sold-out-overlay">已售完</div>}
              {p.stock > 0 && p.stock <= 5 && (
                <div className="stock-badge low">剩 {p.stock}</div>
              )}
              {p.stock > 5 && (
                <div className="stock-badge">剩 {p.stock}</div>
              )}
            </div>
            <div className="card-body">
              <div className="card-name">{p.name}</div>
              <div className="card-desc">{p.desc}</div>
              <div className="card-footer">
                <span className="card-price">NT$ {p.price.toLocaleString()}</span>
                <button
                  className="btn-add"
                  disabled={p.stock === 0}
                  onClick={() => openAddModal(p)}
                >
                  {p.stock === 0 ? '已售完' : '加入購物車'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 我的訂單 */}
      <div className="my-orders">
        <h3 className="sub-title">我的訂單</h3>
        {myOrders.length === 0 ? (
          <p className="empty-hint">目前沒有訂單紀錄</p>
        ) : (
          <div className="order-list">
            {myOrders.map((o) => (
              <div key={o.id} className="order-row">
                <div className="order-info">
                  <span className="order-name">{o.name}</span>
                  <span className="order-meta">x{o.qty} · {o.liveOpen ? '直播拆' : '寄出'}</span>
                </div>
                <div className="order-right">
                  <span className="order-price">NT$ {(o.price * o.qty).toLocaleString()}</span>
                  <span className={`order-status status-${o.status}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // ── 商城 Tab ──
  const renderShopTab = () => (
    <div className="shop-section">
      {/* 商城子選單（左側或頂部） */}
      <div className="shop-submenu">
        {SHOP_SUBMENU.map((s) => (
          <button
            key={s.key}
            className={`submenu-btn ${shopSub === s.key ? 'active' : ''}`}
            onClick={() => setShopSub(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {shopSub === 'products' && (
        <div className="shop-products">
          {/* 商城分級 */}
          <div className="tier-tabs">
            {SHOP_TIERS.map((t) => (
              <button
                key={t.key}
                className={`tier-btn ${shopTier === t.key ? 'active' : ''}`}
                onClick={() => setShopTier(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {(SHOP_PRODUCTS[shopTier] || []).map((p) => (
              <div key={p.id} className={`product-card ${p.stock === 0 ? 'sold-out' : ''}`}>
                <div className="card-img-wrap">
                  <img src={p.image} alt={p.name} onError={(e) => { e.target.style.display = 'none' }} />
                  {p.stock === 0 && <div className="sold-out-overlay">已售完</div>}
                </div>
                <div className="card-body">
                  <div className="card-name">{p.name}</div>
                  <div className="card-footer">
                    <span className="card-price points">{p.points} 點</span>
                    <button
                      className="btn-add"
                      disabled={p.stock === 0}
                      onClick={() => addShopToCart(p)}
                    >
                      {p.stock === 0 ? '已售完' : '兌換'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shopSub === 'myitems' && <div className="placeholder-section">我的物品（串接中）</div>}
      {shopSub === 'shipping' && <div className="placeholder-section">出貨申請（串接中）</div>}
      {shopSub === 'history' && <div className="placeholder-section">點數紀錄（串接中）</div>}
    </div>
  )

  // ── 加入購物車 Modal（今日商品） ──
  const renderAddModal = () => {
    if (!addModal) return null
    const { product } = addModal
    return (
      <div className="modal-overlay" onClick={closeAddModal}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">加入購物車</div>
          <div className="modal-product-name">{product.name}</div>

          {/* 拆卡方式選擇 */}
          <div className="modal-section-label">拆卡方式</div>
          <div className="live-choice-group">
            <button
              className={`choice-btn ${liveOpenChoice === 'live' ? 'active' : ''}`}
              onClick={() => setLiveOpenChoice('live')}
            >
              <span className="choice-icon">📡</span>
              <span className="choice-label">直播拆</span>
              <span className="choice-desc">直播現場開卡</span>
            </button>
            <button
              className={`choice-btn ${liveOpenChoice === 'direct' ? 'active' : ''}`}
              onClick={() => setLiveOpenChoice('direct')}
            >
              <span className="choice-icon">📦</span>
              <span className="choice-label">寄出</span>
              <span className="choice-desc">不直播，直接寄卡</span>
            </button>
          </div>

          {/* 數量 */}
          <div className="modal-section-label">數量</div>
          <div className="qty-control">
            <button className="qty-btn" onClick={() => setAddQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="qty-num">{addQty}</span>
            <button className="qty-btn" onClick={() => setAddQty((q) => Math.min(product.stock, q + 1))}>+</button>
          </div>

          <div className="modal-subtotal">
            小計：<strong>NT$ {(product.price * addQty).toLocaleString()}</strong>
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={closeAddModal}>取消</button>
            <button className="btn-confirm" onClick={confirmAddToCart}>確認加入</button>
          </div>
        </div>
      </div>
    )
  }

  // ── 購物車抽屜 ──
  const renderCart = () => (
    <>
      {/* 購物車按鈕（浮動） */}
      <button className="cart-fab" onClick={() => setCartOpen(true)}>
        🛒
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>

      {/* 購物車抽屜 */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">購物車</span>
              <button className="drawer-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <p className="cart-empty">購物車是空的</p>
            ) : (
              <>
                <div className="cart-list">
                  {cart.map((item) => (
                    <div key={item.key} className="cart-item">
                      <div className="ci-info">
                        <div className="ci-name">{item.name}</div>
                        {item.source === 'today' && (
                          <div className="ci-tag">{item.liveOpen ? '直播拆' : '寄出'}</div>
                        )}
                        {item.source === 'shop' && (
                          <div className="ci-tag shop">點數兌換</div>
                        )}
                      </div>
                      <div className="ci-right">
                        <div className="ci-qty-ctrl">
                          <button onClick={() => changeQty(item.key, -1)}>−</button>
                          <span>{item.qty}</span>
                          <button onClick={() => changeQty(item.key, 1)}>+</button>
                        </div>
                        {item.price && (
                          <div className="ci-price">NT$ {(item.price * item.qty).toLocaleString()}</div>
                        )}
                        {item.points && (
                          <div className="ci-price points">{item.points * item.qty} 點</div>
                        )}
                        <button className="ci-remove" onClick={() => removeFromCart(item.key)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <button className="btn-checkout" onClick={() => setCheckoutOpen(true)}>
                    結帳
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )

  // ── 結帳確認 Modal ──
  const renderCheckout = () => {
    if (!checkoutOpen) return null
    const todayItems = cart.filter((i) => i.source === 'today')
    const shopItems = cart.filter((i) => i.source === 'shop')
    const totalCash = todayItems.reduce((s, i) => s + i.price * i.qty, 0)
    const totalPoints = shopItems.reduce((s, i) => s + i.points * i.qty, 0)
    return (
      <div className="modal-overlay" onClick={() => setCheckoutOpen(false)}>
        <div className="modal-box checkout-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">確認結帳</div>

          {todayItems.length > 0 && (
            <>
              <div className="checkout-section-label">今日商品</div>
              {todayItems.map((i) => (
                <div key={i.key} className="checkout-row">
                  <span>{i.name} x{i.qty} ({i.liveOpen ? '直播拆' : '寄出'})</span>
                  <span>NT$ {(i.price * i.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="checkout-total">合計 NT$ {totalCash.toLocaleString()}</div>
            </>
          )}

          {shopItems.length > 0 && (
            <>
              <div className="checkout-section-label">商城點數兌換</div>
              {shopItems.map((i) => (
                <div key={i.key} className="checkout-row">
                  <span>{i.name} x{i.qty}</span>
                  <span>{i.points * i.qty} 點</span>
                </div>
              ))}
              <div className="checkout-total">合計 {totalPoints} 點</div>
            </>
          )}

          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setCheckoutOpen(false)}>返回</button>
            <button className="btn-confirm" onClick={handleCheckout}>確認送出</button>
          </div>
        </div>
      </div>
    )
  }

  // ── 主渲染 ──
  return (
    <div className="shop-page">
      <style>{shopPageCSS}</style>

      {/* 主 Tab */}
      <div className="main-tabs">
        <button
          className={`main-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => switchTab('today')}
        >
          今日商品
        </button>
        <button
          className={`main-tab ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => switchTab('shop')}
        >
          商城
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'today' && renderTodayTab()}
        {activeTab === 'shop' && renderShopTab()}
      </div>

      {renderAddModal()}
      {renderCart()}
      {renderCheckout()}
    </div>
  )
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const shopPageCSS = `
.shop-page {
  min-height: 100vh;
  background: var(--bg, #0f0f0f);
  color: var(--text, #f0f0f0);
  padding-bottom: 80px;
}

/* ── 主 Tab ── */
.main-tabs {
  display: flex;
  border-bottom: 2px solid var(--border, #2a2a2a);
  background: var(--surface, #1a1a1a);
  position: sticky;
  top: 0;
  z-index: 10;
}
.main-tab {
  flex: 1;
  padding: 14px 0;
  background: none;
  border: none;
  color: var(--text-muted, #888);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s, border-bottom 0.2s;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}
.main-tab.active {
  color: var(--accent, #f5c518);
  border-bottom-color: var(--accent, #f5c518);
}

/* ── Tab 內容 ── */
.tab-content {
  padding: 20px 16px;
  max-width: 800px;
  margin: 0 auto;
}

/* ── 區塊標題 ── */
.section-header { margin-bottom: 20px; }
.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text, #f0f0f0);
  margin: 0 0 4px;
}
.section-desc {
  font-size: 13px;
  color: var(--text-muted, #888);
  margin: 0;
}
.sub-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text, #f0f0f0);
  margin: 32px 0 12px;
}

/* ── 商品 Grid ── */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}
@media (min-width: 640px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}

/* ── 商品卡片 ── */
.product-card {
  background: var(--card, #1e1e1e);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
  transition: transform 0.18s, box-shadow 0.18s;
  border: 1px solid var(--border, #2a2a2a);
}
.product-card:hover:not(.sold-out) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}
.product-card.sold-out { opacity: 0.6; }

.card-img-wrap {
  position: relative;
  aspect-ratio: 1/1;
  background: var(--surface, #141414);
  overflow: hidden;
}
.card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.sold-out-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #aaa;
  letter-spacing: 1px;
}
.stock-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--surface, #1a1a1a);
  color: var(--text-muted, #aaa);
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 20px;
  border: 1px solid var(--border, #333);
}
.stock-badge.low {
  background: #3a1a1a;
  color: #ff6b6b;
  border-color: #ff6b6b55;
}

.card-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #f0f0f0);
  line-height: 1.4;
}
.card-desc {
  font-size: 11px;
  color: var(--text-muted, #888);
  line-height: 1.4;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  gap: 6px;
}
.card-price {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent, #f5c518);
}
.card-price.points { color: #a78bfa; }

.btn-add {
  background: var(--accent, #f5c518);
  color: #111;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  white-space: nowrap;
}
.btn-add:hover:not(:disabled) { opacity: 0.85; transform: scale(1.03); }
.btn-add:disabled {
  background: var(--border, #333);
  color: var(--text-muted, #666);
  cursor: not-allowed;
}

/* ── 訂單列表 ── */
.empty-hint { color: var(--text-muted, #666); font-size: 14px; text-align: center; padding: 24px 0; }
.order-list { display: flex; flex-direction: column; gap: 10px; }
.order-row {
  background: var(--card, #1e1e1e);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border, #2a2a2a);
}
.order-info { display: flex; flex-direction: column; gap: 3px; }
.order-name { font-size: 14px; font-weight: 600; }
.order-meta { font-size: 12px; color: var(--text-muted, #888); }
.order-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.order-price { font-size: 13px; font-weight: 600; color: var(--accent, #f5c518); }
.order-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: #2a2a2a;
  color: #aaa;
}

/* ── 商城子選單 ── */
.shop-submenu {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.submenu-btn {
  background: var(--card, #1e1e1e);
  border: 1px solid var(--border, #2a2a2a);
  color: var(--text-muted, #888);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.submenu-btn.active {
  background: var(--accent, #f5c518);
  color: #111;
  border-color: var(--accent, #f5c518);
}

/* ── 商城分級 Tab ── */
.tier-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}
.tier-btn {
  background: var(--surface, #141414);
  border: 1px solid var(--border, #2a2a2a);
  color: var(--text-muted, #888);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s;
}
.tier-btn.active {
  border-color: var(--accent, #f5c518);
  color: var(--accent, #f5c518);
}

.placeholder-section {
  color: var(--text-muted, #666);
  text-align: center;
  padding: 48px 0;
  font-size: 14px;
}

/* ── 購物車 FAB ── */
.cart-fab {
  position: fixed;
  bottom: 24px;
  right: 20px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent, #f5c518);
  color: #111;
  border: none;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s;
}
.cart-fab:hover { transform: scale(1.08); }
.cart-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  background: #ff4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #111;
}

/* ── 購物車抽屜 ── */
.cart-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}
.cart-drawer {
  width: 100%;
  max-width: 380px;
  background: var(--surface, #161616);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,0.5);
}
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border, #2a2a2a);
}
.drawer-title { font-size: 17px; font-weight: 700; }
.drawer-close {
  background: none;
  border: none;
  color: var(--text-muted, #888);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
}
.cart-empty { color: var(--text-muted, #666); text-align: center; padding: 40px 20px; font-size: 14px; }
.cart-list { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }

.cart-item {
  background: var(--card, #1e1e1e);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  border: 1px solid var(--border, #2a2a2a);
}
.ci-info { flex: 1; }
.ci-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.ci-tag {
  display: inline-block;
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 20px;
  background: #1a2a1a;
  color: #6fcf97;
  border: 1px solid #6fcf9755;
}
.ci-tag.shop { background: #1a1a2a; color: #a78bfa; border-color: #a78bfa55; }
.ci-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.ci-qty-ctrl {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface, #141414);
  border-radius: 6px;
  padding: 3px 8px;
}
.ci-qty-ctrl button {
  background: none;
  border: none;
  color: var(--text, #f0f0f0);
  font-size: 16px;
  cursor: pointer;
  padding: 0 2px;
}
.ci-qty-ctrl span { font-size: 13px; font-weight: 600; min-width: 20px; text-align: center; }
.ci-price { font-size: 13px; font-weight: 700; color: var(--accent, #f5c518); }
.ci-price.points { color: #a78bfa; }
.ci-remove {
  background: none;
  border: none;
  color: var(--text-muted, #555);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
}
.ci-remove:hover { color: #ff6b6b; }

.cart-footer {
  padding: 16px;
  border-top: 1px solid var(--border, #2a2a2a);
}
.btn-checkout {
  width: 100%;
  padding: 14px;
  background: var(--accent, #f5c518);
  color: #111;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-checkout:hover { opacity: 0.88; }

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-box {
  background: var(--surface, #1a1a1a);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
  border: 1px solid var(--border, #2a2a2a);
}
.modal-title { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
.modal-product-name { font-size: 14px; color: var(--text-muted, #aaa); margin-bottom: 20px; }
.modal-section-label { font-size: 12px; font-weight: 600; color: var(--text-muted, #888); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }

/* 拆卡方式按鈕 */
.live-choice-group { display: flex; gap: 10px; margin-bottom: 20px; }
.choice-btn {
  flex: 1;
  background: var(--card, #1e1e1e);
  border: 2px solid var(--border, #2a2a2a);
  border-radius: 10px;
  padding: 12px 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.18s;
}
.choice-btn.active { border-color: var(--accent, #f5c518); background: #1f1a00; }
.choice-icon { font-size: 22px; }
.choice-label { font-size: 13px; font-weight: 700; color: var(--text, #f0f0f0); }
.choice-desc { font-size: 11px; color: var(--text-muted, #888); text-align: center; }

/* 數量控制 */
.qty-control {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  background: var(--card, #1e1e1e);
  border-radius: 10px;
  padding: 10px 16px;
  width: fit-content;
}
.qty-btn {
  background: var(--surface, #141414);
  border: 1px solid var(--border, #333);
  color: var(--text, #f0f0f0);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.qty-btn:hover { background: var(--border, #333); }
.qty-num { font-size: 18px; font-weight: 700; min-width: 28px; text-align: center; }

.modal-subtotal {
  font-size: 14px;
  color: var(--text-muted, #aaa);
  margin-bottom: 20px;
}
.modal-subtotal strong { color: var(--accent, #f5c518); font-size: 16px; }

.modal-actions { display: flex; gap: 10px; }
.btn-cancel {
  flex: 1;
  padding: 12px;
  background: var(--card, #1e1e1e);
  border: 1px solid var(--border, #2a2a2a);
  color: var(--text-muted, #aaa);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover { background: var(--border, #2a2a2a); }
.btn-confirm {
  flex: 2;
  padding: 12px;
  background: var(--accent, #f5c518);
  border: none;
  color: #111;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.18s;
}
.btn-confirm:hover { opacity: 0.88; }

/* ── 結帳 Modal ── */
.checkout-box { max-width: 400px; }
.checkout-section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted, #888);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 16px 0 8px;
}
.checkout-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  color: var(--text, #f0f0f0);
}
.checkout-total {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent, #f5c518);
  text-align: right;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border, #2a2a2a);
}
`
