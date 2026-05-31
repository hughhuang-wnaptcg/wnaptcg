// ── 音效 & 震動工具 ──────────────────────────────────
// 用 Web Audio API 合成音效，不需要外部音檔

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
  if (!ctx) return
  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    playTone(freq, 'triangle', 0.35, 0.25, i * 0.12)
  })
  // 最後加個閃亮尾音
  playTone(1568, 'sine', 0.6, 0.15, notes.length * 0.12)
}

// 積分獲得音效：輕快的叮
export function playPointsSound() {
  playTone(880, 'sine', 0.18, 0.2, 0)
  playTone(1320, 'sine', 0.25, 0.15, 0.08)
}

// 按鈕點擊音效：短促輕敲
export function playClickSound() {
  playTone(440, 'sine', 0.08, 0.12, 0)
}

// 出貨申請成功：愉快提示音
export function playSuccessSound() {
  playTone(523, 'sine', 0.15, 0.18, 0)
  playTone(784, 'sine', 0.2, 0.18, 0.1)
  playTone(1047, 'sine', 0.3, 0.15, 0.2)
}

// 震動封裝
export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern)
  } catch(e) {}
}

export const VIBRATE = {
  light: [30],
  medium: [60],
  success: [40, 30, 40],
  levelUp: [50, 40, 80, 40, 120],
  error: [80, 50, 80],
}
