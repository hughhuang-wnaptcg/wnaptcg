// src/components/CountUp.js
//
// 數字滾動動畫
// ─────────────────────────────────────────────────────────────
// 數值變動時，從舊值「跑動」到新值，而非瞬間跳變。
// 複用 ChallengePage HP 條已驗證的緩動（requestAnimationFrame + ease-out cubic）。
//
// 用法：
//   <CountUp value={member.points} />                    // 1200 → 1150 滾動
//   <CountUp value={member.shop_points} separator />     // 千分位 1,200
//   <CountUp value={todayPoints} prefix="+" suffix=" 點" />
//   <CountUp value={total} prefix="$ " separator />
//
// 注意：
//   - 只用在「會變動且該被強調」的數字（積分、點數、傷害值）。
//   - 不要用在會員編號、日期、頁碼等不該滾動的數字。
//   - 首次掛載預設從 0 跑到初始值（可用 animateOnMount={false} 關閉）。
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react'

export default function CountUp({
  value = 0,
  duration = 700,
  separator = false,     // 是否加千分位
  prefix = '',
  suffix = '',
  decimals = 0,
  animateOnMount = true,
  style,
  className,
}) {
  const target = Number(value) || 0
  const [display, setDisplay] = useState(animateOnMount ? 0 : target)
  const prevRef = useRef(animateOnMount ? 0 : target)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to = target
    if (from === to) { setDisplay(to); return }

    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const current = from + (to - from) * eased
      setDisplay(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
        prevRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  const rounded = decimals > 0
    ? Number(display.toFixed(decimals))
    : Math.round(display)

  const formatted = separator
    ? rounded.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : (decimals > 0 ? rounded.toFixed(decimals) : String(rounded))

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', ...style }} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
