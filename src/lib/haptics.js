// src/lib/haptics.js
//
// 舊版音效 & 震動工具
// ─────────────────────────────────────────────────────────────
// 注意：本檔的「音效」函式現在統一受 sounds.js 的總開關控制
// （localStorage 'wna_sound_enabled'）。只要使用者在設定關閉音效，
// 這裡的所有 play*Sound() 都會變成 no-op，與新版 sounds.js 行為一致。
//
// 「震動」（vibrate / VIBRATE）維持獨立，不受音效開關影響。
// ─────────────────────────────────────────────────────────────

import { isSoundEnabled } from './sounds'

// ── 音效 & 震動工具 ──────────────────────────────────
const ctx = typeof window !== 'undefined' ? (() => {
  try { return new (window.AudioContext || window.webkitAudioContext)() } catch(e) { return null }
})() : null

function playTone(freq, type, duration, gainVal, delay = 0) {
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
    gain.gain.setValueAtTime(0, ctx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + delay + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + duration)
  } catch(e) {}
}

// 升級音效：上升音階
export function playLevelUpSound() {
  if (!isSoundEnabled()) return
  if (!ctx) return
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => { playTone(freq, 'triangle', 0.35, 0.25, i * 0.12) })
  playTone(1568, 'sine', 0.6, 0.15, notes.length * 0.12)
}
// 積分獲得音效
export function playPointsSound() {
  if (!isSoundEnabled()) return
  playTone(880, 'sine', 0.18, 0.2, 0)
  playTone(1320, 'sine', 0.25, 0.15, 0.08)
}
// 按鈕點擊音效
export function playClickSound() {
  if (!isSoundEnabled()) return
  playTone(440, 'sine', 0.08, 0.12, 0)
}
// 出貨申請成功
export function playSuccessSound() {
  if (!isSoundEnabled()) return
  playTone(523, 'sine', 0.15, 0.18, 0)
  playTone(784, 'sine', 0.2, 0.18, 0.1)
  playTone(1047, 'sine', 0.3, 0.15, 0.2)
}
// 全勤慶祝音效：歡樂長版上升音階 + 尾韻
export function playWeekCompleteSound() {
  if (!isSoundEnabled()) return
  if (!ctx) return
  // 主旋律：C E G C E G C（上升）
  const melody = [523, 659, 784, 1047, 1319, 1568, 2093]
  melody.forEach((freq, i) => { playTone(freq, 'triangle', 0.3, 0.22, i * 0.1) })
  // 和聲層
  const harmony = [659, 784, 988, 1319]
  harmony.forEach((freq, i) => { playTone(freq, 'sine', 0.4, 0.1, 0.3 + i * 0.12) })
  // 最後閃亮尾音
  playTone(2093, 'sine', 0.8, 0.18, melody.length * 0.1 + 0.1)
  playTone(2637, 'sine', 0.6, 0.12, melody.length * 0.1 + 0.25)
}
// 補簽成功音效：輕快確認音
export function playMakeUpSound() {
  if (!isSoundEnabled()) return
  playTone(659, 'sine', 0.15, 0.18, 0)
  playTone(880, 'sine', 0.2, 0.18, 0.1)
  playTone(1047, 'sine', 0.25, 0.15, 0.2)
}
// 積分不足提示音：低沉雙音
export function playErrorSound() {
  if (!isSoundEnabled()) return
  playTone(220, 'triangle', 0.2, 0.2, 0)
  playTone(185, 'triangle', 0.25, 0.18, 0.15)
}
// 震動封裝（不受音效開關影響）
export function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern) } catch(e) {}
}
export const VIBRATE = {
  light:        [30],
  medium:       [60],
  success:      [40, 30, 40],
  levelUp:      [50, 40, 80, 40, 120],
  weekComplete: [60, 40, 60, 40, 100, 40, 180],
  error:        [80, 50, 80],
  makeUp:       [40, 20, 40],
}
