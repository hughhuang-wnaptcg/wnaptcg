// src/components/PageTransition.js
//
// 頁面轉場動畫
// ─────────────────────────────────────────────────────────────
// 切換頁面時，新頁面以「淡入 + 輕微上滑」進場，而非瞬間切換，
// 讓 App 更像原生。動畫刻意短而快（0.28s），避免拖慢操作感。
//
// 用法（在 App.js）：
//   import PageTransition from './components/PageTransition'
//   import { useLocation } from 'react-router-dom'
//   ...
//   const location = useLocation()
//   <PageTransition routeKey={location.pathname}>
//     <Routes location={location}> ... </Routes>
//   </PageTransition>
//
// 原理：routeKey（路由 pathname）改變時，外層 div 的 key 改變 →
//   React 重新掛載 → 重新觸發 CSS 進場動畫。
//
// ⚠️ 重要（position: fixed 相容性）：
//   外層 div 在動畫期間會套用 transform。CSS 規範下，任何帶有
//   transform（即使是 translateY(0)）或 will-change: transform 的
//   元素，都會成為其子孫 position:fixed 元素的「containing block」，
//   導致子孫的 fixed 變成「相對此 div 固定」而非「相對視窗固定」，
//   表現為固定元素跟著頁面捲動、被置底。
//
//   為避免破壞頁面內所有 fixed 元素（如首頁「我要出貨」浮動橫幅、
//   商城購物車浮動按鈕），這裡：
//     1. 不使用 will-change（它會「永久」建立 containing block）。
//     2. animation-fill-mode 用 none（預設）：動畫結束後元素回到
//        無 transform 的自然狀態，fixed 即恢復正常。
//        （fill-mode both/forwards 會保留結束幀的 transform，
//         使 transform 永久存在 → fixed 永久失效。）
//   進場動畫起點與終點皆已定義，none 不影響觀感：起始幀套用
//   不會閃爍，結束後停在 translateY(0) 的自然位置。
//
// 效能：只跑進場、不跑離場（離場動畫在路由切換場景反而拖慢感受）；
//   使用 transform + opacity（GPU 加速屬性），低階機也順。
//   若使用者系統開啟「減少動態效果」，自動停用動畫（無障礙）。
// ─────────────────────────────────────────────────────────────
import React from 'react'
export default function PageTransition({ routeKey, children }) {
  return (
    <>
      <style>{`
        @keyframes wnaPageIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .wna-page-transition {
          animation: wnaPageIn 0.28s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .wna-page-transition { animation: none; }
        }
      `}</style>
      <div key={routeKey} className="wna-page-transition">
        {children}
      </div>
    </>
  )
}
