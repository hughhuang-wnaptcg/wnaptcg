// src/lib/berries.js
// ════════════════════════════════════════════════════════════════════
// 樹果採集系統 — 前端工具（場次判斷 / 樣式 / 倒數）
//
// 解法 A：果的種類與分數一律由後端決定（peek_berries / claim_berry），
//   前端不自己算亂數，確保「所見即所得」。
//   本檔只負責：判斷現在是否在場次窗內、樹果外觀樣式、倒數格式、漂浮位置。
//
// ★ 場次/每場顆數/可採時間/每日上限 要與 berry_setup.sql 一致。
// ════════════════════════════════════════════════════════════════════

export const BERRY_SESSIONS = [12, 17, 21]   // ★ 出現場次（整點）
export const BERRIES_PER_SESSION = 3         // ★ 每場顆數
export const BERRY_WINDOW_MIN = 10           // ★ 出現後可採時間（分鐘）
export const BERRY_DAILY_LIMIT = 10          // ★ 每日採集上限

// ── 樹果外觀（kind 對應後端 v_kind）──────────────────────────────
// glow: 超級果特別發光。img: 日後填圖片 URL 即自動換成實際圖片。
export const BERRY_KINDS = {
  super_gold:  { label: '超級黃金樹果', light: '#FFF0A0', hue: '#F5D060', dark: '#8A6A00', glow: true,  img: null },
  black_gold:  { label: '黑金樹果',     light: '#F5D060', hue: '#B8860B', dark: '#1A1A1A', glow: false, img: null },
  platinum:    { label: '白金樹果',     light: '#FFFFFF', hue: '#D8D8D8', dark: '#7A7A7A', glow: false, img: null },
  gold:        { label: '金樹果',       light: '#FAC775', hue: '#E07B00', dark: '#633806', glow: false, img: null },
  red:         { label: '紅樹果',       light: '#F09595', hue: '#E24B4A', dark: '#A32D2D', glow: false, img: null },
  brown:       { label: '棕樹果',       light: '#C9A06A', hue: '#8A5A2A', dark: '#4A2E10', glow: false, img: null },
  black:       { label: '黑樹果',       light: '#6A6A6A', hue: '#2A2A2A', dark: '#000000', glow: false, img: null },
  super_devil: { label: '超級惡魔樹果', light: '#C97AE2', hue: '#7A1FA3', dark: '#2A0040', glow: true,  img: null },
}

export function berryKind(kind) {
  return BERRY_KINDS[kind] || BERRY_KINDS.gold
}

// 樹果漂浮位置（用 index 固定，避免每次 render 亂跳）
export const BERRY_POSITIONS = [
  { x: 18, y: 28 },
  { x: 62, y: 20 },
  { x: 40, y: 56 },
  { x: 24, y: 62 },
  { x: 68, y: 52 },
  { x: 46, y: 30 },
]

// 台灣現在時間（UTC+8）
function taiwanNow() {
  const now = new Date()
  return new Date(now.getTime() + 8 * 3600000)
}

// 台灣日期字串 YYYY-MM-DD
export function taiwanDateStr() {
  return taiwanNow().toISOString().split('T')[0]
}

// 目前是否在某場次可採窗內；是 → 場資訊，否 → null
export function getActiveSession() {
  const tw = taiwanNow()
  const hour = tw.getUTCHours()
  const min = tw.getUTCMinutes()
  if (!BERRY_SESSIONS.includes(hour)) return null
  if (min >= BERRY_WINDOW_MIN) return null
  const secsLeft = (BERRY_WINDOW_MIN - min) * 60 - tw.getUTCSeconds()
  return { hour, dateStr: taiwanDateStr(), secondsLeft: Math.max(0, secsLeft) }
}

// 下一場距離現在多久（給「未到場次」時顯示用），回傳 { hour, label }
export function getNextSession() {
  const tw = taiwanNow()
  const hour = tw.getUTCHours()
  for (const h of BERRY_SESSIONS) {
    if (h > hour || (h === hour && tw.getUTCMinutes() < BERRY_WINDOW_MIN)) {
      return { hour: h, label: `${h}:00` }
    }
  }
  return { hour: BERRY_SESSIONS[0], label: `明天 ${BERRY_SESSIONS[0]}:00` }
}

// 倒數 mm:ss
export function fmtCountdown(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
