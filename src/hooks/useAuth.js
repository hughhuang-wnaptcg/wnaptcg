import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

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
    const { data } = await supabase.from('members').select('*').eq('id', userId).single()
    if (data) {
      await handleDailyLogin(data)
      setMember(data)
    }
    setLoading(false)
  }

  async function handleDailyLogin(m) {
    const today = new Date().toISOString().split('T')[0]
    if (m.last_login_date === today) return
    const { error } = await supabase.from('daily_logins').insert({ member_id: m.id, login_date: today })
    if (error) return
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const newStreak = m.last_login_date === yesterday ? m.login_streak + 1 : 1
    const isWeekComplete = newStreak % 7 === 0
    const bonusPoints = isWeekComplete ? 15 : 0
    const totalPoints = m.points + 5 + bonusPoints
    const { getLevel } = await import('../lib/supabase')
    const newLevel = getLevel(totalPoints)
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
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMember(null)
  }

  return <AuthContext.Provider value={{ member, loading, setMember, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
