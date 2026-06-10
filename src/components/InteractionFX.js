// src/components/InteractionFX.js
//
// 全站互動效果：按壓微動畫
// ─────────────────────────────────────────────────────────────
// 用法：
//   1. 在 App.js（或任一最上層元件）引入一次 <InteractionFXStyles />，
//      把全域 CSS 注入頁面。
//   2. 任何想要「按下縮放」效果的元素，加上 className="press-fx"。
//      若元素已有 className，用模板字串合併：className={`press-fx ${其他}`}
//
// 為什麼用 class 而非 inline style：
//   inline style 無法表達 :active 偽類，按壓效果一定需要 CSS。
//   這裡只注入一小段全域 style（與專案既有的 <style> keyframes 寫法一致），
//   不引入任何 CSS 框架，符合全站設計原則。
// ─────────────────────────────────────────────────────────────

import React from 'react'

export function InteractionFXStyles() {
  return (
    <style>{`
      .press-fx {
        transition: transform 0.08s ease, filter 0.12s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .press-fx:active:not(:disabled) {
        transform: scale(0.96);
      }
      .press-fx:disabled {
        cursor: not-allowed;
      }
      /* 卡片類較大的元素縮放幅度小一點，避免太誇張 */
      .press-fx-soft {
        transition: transform 0.1s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .press-fx-soft:active {
        transform: scale(0.985);
      }
    `}</style>
  )
}

export default InteractionFXStyles
