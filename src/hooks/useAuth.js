import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loginResult, setLoginResult] = useState(null)
  // loginResult: { isNewMember, pointsEarned, bonusEarned, levelUp, newLevel, oldLevel }

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
    let { data } = await supabase.from('members').select('*').eq('id', userId).single()
    let isNewMember = false
    if (!data) {
      isNewMember = true
      const { data: userData } = await supabase.auth.getUser()
      const email = userData?.user?.email || ''
      const { data: newMember } = await supabase.from('members').insert({
        id: userId,
        email,
        display_name: email.split('@')[0],
      }).select().single()
      data = newMember
    }
    if (data) {
      const result = await handleDailyLogin(data, isNewMember)
      const { data: refreshed } = await supabase.from('members').select('*').eq('id', userId).single()
      setMember(refreshed || data)
      if (result) setLoginResult(result)
    }
    setLoading(false)
  }

  async function handleDailyLogin(m, isNewMember) {
    const today = new Date().toISOString().split('T')[0]
    // 已登入過今天，不重複給分，但若是新會員仍顯示引導
    if (m.last_login_date === today) {
      if (isNewMember) return { isNewMember: true, pointsEarned: 0, bonusEarned: 0, levelUp: false }
      return null
    }
    const { error } = await supabase.from('daily_logins').insert({ member_id: m.id, login_date: today })
    if (error) return null

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newStreak = m.last_login_date === yesterday ? m.login_streak + 1 : 1
    const isWeekComplete = newStreak % 7 === 0
    const bonusPoints = isWeekComplete ? 15 : 0
    const pointsEarned = 5
    const totalPoints = m.points + pointsEarned + bonusPoints
    const { getLevel } = await import('../lib/supabase')
    const oldLevel = m.level
    const newLevel = getLevel(totalPoints)
    const levelUp = newLevel !== oldLevel

    await supabase.from('members').update({
      points: totalPoints,
      level: newLevel,
      login_streak: newStreak,
      total_logins: m.total_logins + 1,
      last_login_date: today,
    }).eq('id', m.id)

    await supabase.from('point_logs').insert({ member_id: m.id, type: 'login', points: 5, note: '每日登入' })
    if (bonusPoints > 0) {
      await supabase.from('point_logs').insert({ member_id: m.id, type: 'streak_bonus', points: bonusPoints, note: '全勤獎勵' })
    }

    return { isNewMember, pointsEarned, bonusEarned: bonusPoints, levelUp, newLevel, oldLevel, newStreak }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMember(null)
    setLoginResult(null)
  }

  function clearLoginResult() {
    setLoginResult(null)
  }

  return (
    <AuthContext.Provider value={{ member, loading, setMember, signOut, loginResult, clearLoginResult }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
