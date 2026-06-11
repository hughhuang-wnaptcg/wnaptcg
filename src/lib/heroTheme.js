// src/lib/heroTheme.js
// ════════════════════════════════════════════════════════════════════
// 全站 Hero 主題（統一暖白金，不再依球種換膚）
//
// 用法：
//   import { heroTheme } from '../lib/heroTheme'
//   const hero = heroTheme(getLevel(member.points))
//   <div style={{ background: hero.bg }}>
//     <span style={{ color: hero.name }}>...</span>
//   </div>
//
// 欄位說明：
//   dark         深色主題（文字需翻淺色，供頁面自行判斷用）
//   bg           Hero 背景漸層
//   accent       主色（名字、重點）
//   name         主文字色
//   sub          次文字色
//   eyebrow      頂部英文標 / 小標色
//   pillBg/pillBorder/pillText/pillStar  「今日已獲得」之類膠囊
//   avatarBorder 頭像框色
//   levelText    等級小字色
//   wave         底部收邊波浪色（填下方頁面底色，維持米白）
//
// 註：heroTheme() 現在一律回傳 HERO_DEFAULT（暖白金），全站 Hero 統一風格、
//     不再依球種變色。HERO_THEME 保留備用，若日後想恢復球種換膚，
//     將 heroTheme() 改回 `HERO_THEME[level] || HERO_DEFAULT` 即可。
// ════════════════════════════════════════════════════════════════════
export const HERO_DEFAULT = {
  dark: false,
  bg: 'linear-gradient(160deg,#FFFBF2 0%,#FFF5DC 60%,#FFEDBB 100%)',
  accent: '#BA7517', name: '#2D1A00', sub: '#A07040', eyebrow: '#E07B00',
  pillBg: '#fff', pillBorder: '#FAC775', pillText: '#8B4A00', pillStar: '#E07B00',
  avatarBorder: '#FAC775', levelText: '#BA7517', wave: '#FFFBF2',
}

// ── 球種換膚配色（保留備用，目前未啟用）──
export const HERO_THEME = {
  高級球: {
    dark: false,
    bg: 'linear-gradient(160deg,#FFF8E0 0%,#FFEFA8 60%,#F5D04A 100%)',
    accent: '#5A4A0A', name: '#1A1A1A', sub: '#6B5A12', eyebrow: '#5A4A0A',
    pillBg: '#fff', pillBorder: '#1A1A1A', pillText: '#5A4A0A', pillStar: '#5A4A0A',
    avatarBorder: '#1A1A1A', levelText: '#5A4A0A', wave: '#FFFBF2',
  },
  豪華球: {
    dark: true,
    bg: 'linear-gradient(160deg,#2A1B10 0%,#3A2415 60%,#1A1008 100%)',
    accent: '#EF9F27', name: '#F7E4C0', sub: '#C9A06A', eyebrow: '#EF9F27',
    pillBg: 'rgba(239,159,39,0.10)', pillBorder: '#EF9F27', pillText: '#F7E4C0', pillStar: '#EF9F27',
    avatarBorder: '#EF9F27', levelText: '#C9A06A', wave: '#FFFBF2',
  },
  貴重球: {
    dark: true,
    bg: 'linear-gradient(160deg,#2A1414 0%,#3B1C1C 60%,#1A0C0C 100%)',
    accent: '#E24B4A', name: '#F7D6D0', sub: '#C98A82', eyebrow: '#E24B4A',
    pillBg: 'rgba(226,75,74,0.10)', pillBorder: '#E24B4A', pillText: '#F7D6D0', pillStar: '#E24B4A',
    avatarBorder: '#E24B4A', levelText: '#C98A82', wave: '#FFFBF2',
  },
  究極球: {
    dark: true,
    bg: 'linear-gradient(160deg,#10204A 0%,#1B2F66 60%,#0C1838 100%)',
    accent: '#6E9BFF', name: '#CFE0FF', sub: '#8FA8DD', eyebrow: '#8FA8DD',
    pillBg: 'rgba(255,255,255,0.08)', pillBorder: '#6E9BFF', pillText: '#CFE0FF', pillStar: '#6E9BFF',
    avatarBorder: '#6E9BFF', levelText: '#8FA8DD', wave: '#FFFBF2',
  },
  大師球: {
    dark: true,
    bg: 'linear-gradient(160deg,#1A1A1A 0%,#2A2030 60%,#0E0C0A 100%)',
    accent: '#F5D060', name: '#FDF0C0', sub: '#B6A06A', eyebrow: '#B8860B',
    pillBg: 'rgba(245,208,96,0.10)', pillBorder: '#F5D060', pillText: '#F5D060', pillStar: '#F5D060',
    avatarBorder: '#F5D060', levelText: '#B6A06A', wave: '#FFFBF2',
  },
}

// 全站 Hero 統一暖白金：一律回傳 HERO_DEFAULT，不再依球種變色。
// 註：保留無參數簽名；呼叫端即使傳入 level（如 heroTheme(member.level)）也會被忽略，不影響運作。
export function heroTheme() {
  return HERO_DEFAULT
}
