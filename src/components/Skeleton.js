// src/components/Skeleton.js
//
// 全站統一骨架屏（載入中佔位）
// ─────────────────────────────────────────────────────────────
// 用法：
//   import { SkeletonCardGrid, SkeletonList, SkeletonBlock } from '../components/Skeleton'
//   {loading ? <SkeletonCardGrid count={6} /> : <真正內容 />}
//
// 設計：暖黃色系骨架（與全站 #FFFBF2 / #F5E8C8 一致），
//       使用 shimmer 掃光動畫，零外部依賴。
// ─────────────────────────────────────────────────────────────

import React from 'react'

// 共用 shimmer 樣式（一次注入，多個骨架共用）
function ShimmerStyles() {
  return (
    <style>{`
      @keyframes wnaSkShimmer {
        0% { background-position: -360px 0 }
        100% { background-position: 360px 0 }
      }
      .wna-sk {
        background: linear-gradient(90deg, #f3ece0 25%, #faf5ec 50%, #f3ece0 75%);
        background-size: 720px 100%;
        animation: wnaSkShimmer 1.4s ease infinite;
      }
    `}</style>
  )
}

// 單一矩形骨架塊
export function SkeletonBlock({ width = '100%', height = 12, radius = 6, style }) {
  return (
    <div
      className="wna-sk"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

// 卡片網格骨架（戰績牆、商城等 3:4 卡片用）
export function SkeletonCardGrid({ count = 6, columns = 2, padding = '14px 20px 20px' }) {
  return (
    <>
      <ShimmerStyles />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns},1fr)`, gap: 10, padding }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 16px rgba(186,117,23,.06)' }}>
            <div className="wna-sk" style={{ aspectRatio: '3/4', width: '100%' }} />
            <div style={{ padding: '8px 10px 10px' }}>
              <SkeletonBlock width="75%" height={10} style={{ marginBottom: 6 }} />
              <SkeletonBlock width="45%" height={9} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// 列表骨架（排行榜、紀錄列等）
export function SkeletonList({ count = 5, padding = '8px 16px' }) {
  return (
    <>
      <ShimmerStyles />
      <div style={{ padding }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '0.5px solid #f5f0e8' }}>
            <div className="wna-sk" style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock width="55%" height={11} style={{ marginBottom: 6 }} />
              <SkeletonBlock width="35%" height={9} />
            </div>
            <SkeletonBlock width={36} height={11} radius={6} />
          </div>
        ))}
      </div>
    </>
  )
}

// 通用區塊骨架（Boss 戰場、統計卡等大區塊用）
export function SkeletonPanel({ height = 120, padding = '16px', radius = 12 }) {
  return (
    <>
      <ShimmerStyles />
      <div style={{ padding }}>
        <div className="wna-sk" style={{ width: '100%', height, borderRadius: radius }} />
      </div>
    </>
  )
}

export default SkeletonCardGrid
