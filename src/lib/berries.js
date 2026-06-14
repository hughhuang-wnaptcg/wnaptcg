// src/lib/berries.js
// ════════════════════════════════════════════════════════════════════
// 樹果採集系統 — 前端工具（場次判斷 / 樣式 / 倒數 / 造型）
//
// 解法 A：果的種類與分數一律由後端決定（peek_berries / claim_berry），
//   前端不自己算亂數，確保「所見即所得」。
//   本檔只負責：判斷現在是否在場次窗內、樹果外觀（SVG 造型）、倒數格式、飄落位置。
//
// ★ 場次/每場顆數/可採時間/每日上限 要與 berry_setup.sql 一致。
// ════════════════════════════════════════════════════════════════════
export const BERRY_SESSIONS = [12, 17, 21]   // ★ 出現場次（整點）
export const BERRIES_PER_SESSION = 3         // ★ 每場顆數
export const BERRY_WINDOW_MIN = 10           // ★ 出現後可採時間（分鐘）
export const BERRY_DAILY_LIMIT = 10          // ★ 每日採集上限

// ── 樹果外觀（kind 對應後端 v_kind）──────────────────────────────
// glow: 特殊果發光。shape: 對應 berrySvg() 的造型。img: 日後填圖片 URL 即自動換成實際圖片。
// 色彩邏輯：亮色＝正分/高價值；暗色＝可能扣分（帶暗紋暗示）；發光＝特殊稀有。
export const BERRY_KINDS = {
  super_gold:  { label: '超級黃金樹果', shape: 'drop',    glow: true,  tone: 'plus',  img: null },
  black_gold:  { label: '黑金樹果',     shape: 'gourd',   glow: false, tone: 'dark',  img: null },
  platinum:    { label: '白金樹果',     shape: 'round',   glow: false, tone: 'plus',  img: null },
  gold:        { label: '金樹果',       shape: 'onion',   glow: false, tone: 'plus',  img: null },
  red:         { label: '紅樹果',       shape: 'heart',   glow: false, tone: 'plus',  img: null },
  brown:       { label: '棕樹果',       shape: 'oval',    glow: false, tone: 'dark',  img: null },
  black:       { label: '黑樹果',       shape: 'spike',   glow: false, tone: 'dark',  img: null },
  super_devil: { label: '超級惡魔樹果', shape: 'devil',   glow: true,  tone: 'dark',  img: null },
}

export function berryKind(kind) {
  return BERRY_KINDS[kind] || BERRY_KINDS.gold
}

// ── 每種果的配色（果體漸層三段 + 描邊 + 萼片 + 高光）──────────────
// l=亮、m=中、d=暗、stroke=描邊、calyx=萼片、stem=梗、hi=高光透明度、vein=暗紋色(扣分果用)
const BERRY_PALETTE = {
  super_gold:  { l:'#FFF6C8', m:'#FFE066', d:'#E0A000', stroke:'#C8860B', calyx:'#4F8016', stem:'#5C8A1E', hi:0.65, vein:null,            glowColor:'rgba(245,208,96,1)' },
  gold:        { l:'#FFD89A', m:'#F0A030', d:'#A85E00', stroke:'#8A5010', calyx:'#4F8016', stem:'#5C8A1E', hi:0.5,  vein:null,            glowColor:null },
  red:         { l:'#FFC0C0', m:'#E85858', d:'#A02828', stroke:'#7A1F1F', calyx:'#4F8016', stem:'#5C8A1E', hi:0.55, vein:null,            glowColor:null },
  platinum:    { l:'#FFFFFF', m:'#E0E0E6', d:'#9AA0AA', stroke:'#9AA0AA', calyx:'#5A8020', stem:'#5C8A1E', hi:0.8,  vein:null,            glowColor:null },
  black_gold:  { l:'#6A5A2A', m:'#2A2218', d:'#0E0A04', stroke:'#B8860B', calyx:'#4A3A10', stem:'#3A5A12', hi:0.45, vein:'rgba(245,208,96,0.3)', glowColor:null },
  brown:       { l:'#C9A06A', m:'#8A5A2A', d:'#4A2E10', stroke:'#3A2410', calyx:'#3A4A1E', stem:'#3A5A12', hi:0.4,  vein:'rgba(58,36,16,0.55)',  glowColor:null },
  black:       { l:'#5A5A62', m:'#2A2A2E', d:'#0A0A0C', stroke:'#000000', calyx:'#3A4A1E', stem:'#3A5A12', hi:0.4,  vein:'rgba(0,0,0,0.45)',     glowColor:null },
  super_devil: { l:'#E0A0F0', m:'#9A30C0', d:'#3A0050', stroke:'#3A0050', calyx:'#3A1A4A', stem:'#5C2A7A', hi:0.5,  vein:null,            glowColor:'rgba(190,100,230,1)' },
}

// 各造型的「果體輪廓 path」（viewBox 0 0 62 68）
const SHAPE_BODY = {
  drop:  'M31 8 C44 8 54 22 54 38 C54 53 44 62 31 62 C18 62 8 53 8 38 C8 22 18 8 31 8 Z',
  onion: 'M31 10 C37 10 40 16 39 22 C46 26 52 34 52 42 C52 54 42 62 31 62 C20 62 10 54 10 42 C10 34 16 26 23 22 C22 16 25 10 31 10 Z',
  heart: 'M31 18 C28 11 20 8 14 13 C7 19 9 32 18 44 C23 51 28 57 31 60 C34 57 39 51 44 44 C53 32 55 19 48 13 C42 8 34 11 31 18 Z',
  spike: 'M31 9 C43 9 53 20 53 33 C53 44 45 54 31 63 C17 54 9 44 9 33 C9 20 19 9 31 9 Z',
  gourd: 'M31 9 C40 9 45 16 44 24 C50 28 52 34 52 40 C52 53 42 62 31 62 C20 62 10 53 10 40 C10 34 12 28 18 24 C17 16 22 9 31 9 Z',
  round: 'M31 9 C45 9 54 21 54 36 C54 51 45 62 31 62 C17 62 8 51 8 36 C8 21 17 9 31 9 Z',
  oval:  'M31 11 C46 11 55 22 55 36 C55 50 46 61 31 61 C16 61 7 50 7 36 C7 22 16 11 31 11 Z',
  devil: 'M31 8 C42 8 52 19 52 33 C52 45 44 55 31 63 C18 55 10 45 10 33 C10 19 20 8 31 8 Z',
}

// 星狀萼片（兩種：一般 / 簡化），底部
const CALYX_FULL  = 'M31 60 L20 52 L26 58 L18 56 L27 61 L20 64 L29 62 L25 67 L31 63 L37 67 L33 62 L42 64 L35 61 L44 56 L36 58 L42 52 Z'
const CALYX_STD   = 'M31 60 L21 54 L27 59 L20 62 L29 61 L25 66 L31 62 L37 66 L33 61 L42 62 L35 59 L41 54 Z'
const CALYX_HEART = 'M31 60 L21 55 L27 60 L20 62 L29 61 L31 66 L33 61 L42 62 L35 60 L41 55 Z'

// 梗（一般 / 惡魔）
const STEM_STD   = 'M31 9 C30 4 33 2 36 1 C34 4 35 7 32 9 Z'
const STEM_DEVIL = 'M31 9 C30 3 33 1 36 0 C34 3 35 6 32 9 Z'

// ── 回傳某 kind 的完整 SVG 字串（可直接塞進 dangerouslySetInnerHTML / img src）──
// size：像素寬高（高度依 62:68 比例自動）。idSuffix：避免同頁多顆 gradient id 衝突。
export function berrySvg(kind, size = 56, idSuffix = '') {
  const k = berryKind(kind)
  const pal = BERRY_PALETTE[kind] || BERRY_PALETTE.gold
  const body = SHAPE_BODY[k.shape] || SHAPE_BODY.drop
  const h = Math.round(size * (68 / 62))
  const gid = `bg_${kind}_${idSuffix}`

  // 萼片造型：愛心用窄版，其餘用標準；超級黃金用完整星狀
  const calyx = k.shape === 'heart' ? CALYX_HEART : (kind === 'super_gold' ? CALYX_FULL : CALYX_STD)
  const stem = k.shape === 'devil' ? STEM_DEVIL : STEM_STD

  // 高光位置（依造型微調）
  const hiCx = k.shape === 'onion' ? 24 : 23
  const hiCy = k.shape === 'onion' ? 34 : (k.shape === 'heart' ? 26 : 24)
  const hiRx = (k.shape === 'heart' || k.shape === 'devil') ? 6.5 : (k.shape === 'gourd' || k.shape === 'oval' ? 6.5 : 8)
  const hiRy = (k.shape === 'gourd') ? 8 : (k.shape === 'heart' || k.shape === 'devil' || k.shape === 'oval' ? 9 : 11)
  const hiColor = kind === 'black' ? 'rgba(180,180,200,' : (kind === 'black_gold' ? 'rgba(245,208,96,' : 'rgba(255,255,255,')

  // 暗紋（扣分果）
  let veins = ''
  if (pal.vein) {
    if (kind === 'brown') {
      veins = `<path d="M37 28 Q42 37 38 46" stroke="${pal.vein}" stroke-width="2" fill="none"/><path d="M27 30 Q24 38 28 46" stroke="rgba(58,36,16,0.35)" stroke-width="1.5" fill="none"/>`
    } else if (kind === 'black') {
      veins = `<path d="M38 30 Q43 38 39 47" stroke="${pal.vein}" stroke-width="2" fill="none"/>`
    } else if (kind === 'black_gold') {
      veins = `<path d="M40 30 Q44 40 39 50" stroke="${pal.vein}" stroke-width="1.5" fill="none"/>`
    }
  }

  // 惡魔角
  const devilHorns = k.shape === 'devil'
    ? `<path d="M18 14 L14 6 L22 12 Z" fill="#7A1FA3"/><path d="M44 14 L48 6 L40 12 Z" fill="#7A1FA3"/>`
    : ''

  // 第二高光（圓潤/白金/超級黃金多一點）
  const hi2 = (kind === 'platinum' || kind === 'super_gold')
    ? `<ellipse cx="42" cy="46" rx="3.5" ry="5" fill="rgba(255,255,255,${kind === 'platinum' ? 0.5 : 0.3})"/>`
    : ''

  const strokeW = kind === 'black_gold' ? 1.3 : 1

  return `<svg width="${size}" height="${h}" viewBox="0 0 62 68" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
<defs><radialGradient id="${gid}" cx="38%" cy="28%" r="72%">
<stop offset="0%" stop-color="${pal.l}"/><stop offset="48%" stop-color="${pal.m}"/><stop offset="100%" stop-color="${pal.d}"/>
</radialGradient></defs>
<path d="${calyx}" fill="${pal.calyx}"/>
${devilHorns}
<path d="${body}" fill="url(#${gid})" stroke="${pal.stroke}" stroke-width="${strokeW}"/>
<path d="${stem}" fill="${pal.stem}"/>
<ellipse cx="${hiCx}" cy="${hiCy}" rx="${hiRx}" ry="${hiRy}" fill="${hiColor}${pal.hi})" transform="rotate(-20 ${hiCx} ${hiCy})"/>
${hi2}
${veins}
</svg>`
}

// 樹果飄落起始位置（用 index 固定，避免每次 render 亂跳）
// x=水平位置(%)，fall=落下距離(px)，sway=左右搖擺(px)，dur=飄落秒數，delay=延遲秒數
export const BERRY_POSITIONS = [
  { x: 14, fall: 120, sway: 18,  dur: 3.4, delay: 0.1 },
  { x: 60, fall: 220, sway: -22, dur: 4.2, delay: 0.5 },
  { x: 38, fall: 340, sway: 16,  dur: 4.8, delay: 0.9 },
  { x: 24, fall: 280, sway: -16, dur: 4.0, delay: 0.7 },
  { x: 68, fall: 160, sway: 20,  dur: 3.7, delay: 0.3 },
  { x: 46, fall: 400, sway: -14, dur: 5.0, delay: 1.1 },
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
