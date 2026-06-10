// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const LAST_LEVEL_KEY = 'wnaptcg_last_level'

// ── 並發鎖（module 層級，同步生效）──────────────────────────
// 頁面載入時 getSession 與 onAuthStateChange 可能近乎同時觸發 fetchMember，
// 導致 handleDailyLogin 並發執行、重複加分。用 module 層級的 Set 記錄
// 「正在處理中的 userId」，第二次進入直接略過。
// 之所以不用 React state：state 更新是非同步的，擋不住同一輪事件的並發；
// module 變數是同步寫入、立即生效，才能真正鎖住。
const processingUsers = new Set()

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loginResult, setLoginResult] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchMember(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchMember(session.user.id)
      else { setMember(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchMember(userId) {
    // 並發鎖：若此 user 正在處理中，直接略過第二次呼叫
    if (processingUsers.has(userId)) return
    processingUsers.add(userId)
    try {
      let { data } = await supabase.from('members').select('*').eq('id', userId).single()
      let isNewMember = false

      if (!data) {
        isNewMember = true
        const { data: userData } = await supabase.auth.getUser()
        const email = userData?.user?.email || ''
        const { data: newMember } = await supabase.from('members').insert({
          id: userId, email, display_name: email.split('@')[0],
        }).select().single()
        data = newMember
      }

      if (data) {
        const lastLevel = localStorage.getItem(LAST_LEVEL_KEY)
        const levelUp = lastLevel && lastLevel !== data.level
        const oldLevel = lastLevel || null
        const dailyResult = await handleDailyLogin(data, isNewMember)
        localStorage.setItem(LAST_LEVEL_KEY, data.level)

        const { data: refreshed } = await supabase.from('members').select('*').eq('id', userId).single()
        const finalMember = refreshed || data
        setMember(finalMember)

        const hasLevelUp = levelUp || (dailyResult?.levelUp)
        const effectiveOldLevel = dailyResult?.oldLevel || oldLevel
        const effectiveNewLevel = dailyResult?.newLevel || finalMember.level

        if (isNewMember || dailyResult?.pointsEarned > 0 || hasLevelUp) {
          setLoginResult({
            isNewMember,
            pointsEarned: dailyResult?.pointsEarned || 0,
            bonusEarned: dailyResult?.bonusEarned || 0,
            levelUp: hasLevelUp,
            oldLevel: effectiveOldLevel,
            newLevel: effectiveNewLevel,
            newStreak: dailyResult?.newStreak || finalMember.login_streak,
            // ── 新增：7日全勤旗標 ──
            weekComplete: dailyResult?.weekComplete || false,
          })
        }

        if (hasLevelUp) localStorage.setItem(LAST_LEVEL_KEY, effectiveNewLevel)
      }
    } finally {
      // 無論成功或出錯都要解鎖，否則此 user 之後永遠無法再進入
      processingUsers.delete(userId)
      setLoading(false)
    }
  }

  async function handleDailyLogin(m, isNewMember) {
    const today = new Date().toISOString().split('T')[0]
    if (m.last_login_date === today) {
      if (isNewMember) return { isNewMember: true, pointsEarned: 0, bonusEarned: 0, levelUp: false, weekComplete: false }
      return null
    }

    const { error } = await supabase.from('daily_logins').insert({ member_id: m.id, login_date: today })
    if (error) return null

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newStreak = m.last_login_date === yesterday ? m.login_streak + 1 : 1
    const weekComplete = newStreak % 7 === 0  // 7的倍數 = 全勤
    const bonusPoints = weekComplete ? 15 : 0
    const pointsEarned = 5
    const currentPoints = m.points || 0
    const totalPoints = currentPoints + pointsEarned + bonusPoints
    const { getLevel } = await import('../lib/supabase')
    const oldLevel = m.level
    const newLevel = getLevel(totalPoints)
    const levelUp = newLevel !== oldLevel

    await supabase.from('members').update({
      points: totalPoints, level: newLevel,
      login_streak: newStreak, total_logins: m.total_logins + 1,
      last_login_date: today,
    }).eq('id', m.id)

    await supabase.from('point_logs').insert({ member_id: m.id, type: 'login', points: 5, note: '每日登入' })
    if (bonusPoints > 0) {
      await supabase.from('point_logs').insert({ member_id: m.id, type: 'streak_bonus', points: bonusPoints, note: '7日全勤獎勵' })
    }

    return { isNewMember, pointsEarned, bonusEarned: bonusPoints, levelUp, newLevel, oldLevel, newStreak, weekComplete }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMember(null)
    setLoginResult(null)
    localStorage.removeItem(LAST_LEVEL_KEY)
  }

  function clearLoginResult() { setLoginResult(null) }

  return (
    <AuthContext.Provider value={{ member, loading, setMember, signOut, loginResult, clearLoginResult }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
