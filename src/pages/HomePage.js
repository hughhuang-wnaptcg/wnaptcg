// ── HomePage.js 音效整合 ──────────────────────────────
// 在現有 import 區塊加入：
import { playSound } from '../lib/sounds'

// 原本已有的 haptics import 保留不動：
// import { playWeekCompleteSound, playMakeUpSound, playErrorSound, vibrate, VIBRATE } from '../lib/haptics'

// ── 需要加入 playSound 的位置 ──────────────────────────

// 1. 每日簽到成功（在 useAuth loginResult 觸發處）
// 位置：useEffect 裡 loginResult?.weekComplete 判斷之前
// 加在 loginResult 有值且非 weekComplete 的情況：
useEffect(() => {
  if (!loginResult) return
  if (loginResult.weekComplete) {
    setTimeout(() => {
      setShowWeekCelebration(true)
      playWeekCompleteSound()       // 保留原有
      playSound('checkin_success')  // ← 加入
      vibrate(VIBRATE.weekComplete)
      setTimeout(() => setShowWeekCelebration(false), 4000)
    }, 2800)
  } else if (loginResult.pointsEarned) {
    playSound('checkin_success')    // ← 加入：一般簽到成功
  }
}, [loginResult])

// 2. 補簽成功（handleMakeUp 成功後）
// 原本有 playMakeUpSound()，在其後加入：
playMakeUpSound()
playSound('points_earned')  // ← 加入

// 3. 補簽積分不足（handleMakeUp 錯誤判斷處）
// 原本有 playErrorSound()，在其後加入：
playErrorSound()
playSound('error_points')  // ← 加入
