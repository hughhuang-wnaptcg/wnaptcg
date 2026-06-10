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
          animation: wnaPageIn 0.28s ease-out both;
          will-change: opacity, transform;
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
