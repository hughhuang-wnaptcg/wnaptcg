// ── ShopPage.js 音效整合 ──────────────────────────────
// 在現有 import 區塊加入：
import { playSound } from '../lib/sounds'

// ── 需要加入 playSound 的位置 ──────────────────────────

// 1. 直播下單成功
// 位置：handleCheckout() 內，setOrderSuccess(successData) 之後
setOrderSuccess(successData)
playSound('order_success')  // ← 加入

// 2. 商城兌換成功
// 位置：handleBuy() 內，setSuccessProduct(confirmProduct) 之後
setSuccessProduct(confirmProduct)
setSuccessQty(confirmQty)
playSound('shop_redeem_success')  // ← 加入

// 3. 點數不足（兌換 Sheet 中，canAfford 為 false 時點按鈕）
// 位置：handleBuy() 開頭判斷
if (member.shop_points < totalCost) {
  playSound('error_points')  // ← 加入
  return
}

// 4. Tab 切換
// 位置：Tab 按鈕的 onClick
onClick={() => {
  setMainTab(t.key)
  setSearchParams(t.key === 'shop' ? { tab: 'shop' } : {})
  playSound('tab_switch')  // ← 加入
}}

// 5. 購物車開啟
// 位置：查看購物車按鈕的 onClick
onClick={() => { setShowCart(true); playSound('modal_open') }}  // ← 加入

// 6. 購物車關閉
// 位置：closeCart() 函式內
function closeCart() {
  playSound('modal_close')  // ← 加入
  setCartFading(true)
  setTimeout(() => { setShowCart(false); setCartFading(false) }, 250)
}

// 7. 庫存為 0 時加入購物車（可選）
// 位置：addToCart() 內，soldOut 判斷
function addToCart(item) {
  if (item.stock <= 0) { playSound('error_stock'); return }  // ← 加入
  // ... 原有邏輯
}
