// ── ChallengePage.js 音效整合 ──────────────────────────
// 在現有 import 區塊加入：
import { playSound } from '../lib/sounds'

// ── 需要加入 playSound 的位置 ──────────────────────────

// 1. Boss 討伐成功（progress 達到 100% 時）
// 位置：fetchData() 內，取得 bossData 後計算 progress
// 在 setBoss(bossData) 後加入：
const pct = Math.round((bossData.current_amount / bossData.target_amount) * 100)
if (pct >= 100) {
  playSound('boss_defeated')  // ← 加入
}

// 2. 說明 Sheet 開啟
// 位置：？按鈕 onClick
onClick={() => { setShowHint(true); playSound('modal_open') }}

// 3. 說明 Sheet 關閉
// 位置：ChallengeHintSheet 的 onClose 呼叫時
// 在 ChallengeHintSheet 元件外部（ChallengePage 主頁面）：
<ChallengeHintSheet onClose={() => { setShowHint(false); playSound('modal_close') }} />
