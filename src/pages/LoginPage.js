import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LIFF_ID = '2010232634-k2C4gSOg'
const hasLiffCallback = () => {
  const params = new URLSearchParams(window.location.search)
  return params.has('code') || params.has('state') || params.has('liff.state')
}

const BENEFITS = [
  { icon: 'fa-trophy', text: '戰績牆開箱紀錄' },
  { icon: 'fa-star', text: '積分升級制度' },
  { icon: 'fa-shield', text: '共同挑戰 Boss' },
  { icon: 'fa-gift', text: '每月專屬獎勵' },
]

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Font Awesome 6.5.0
    if (!document.getElementById('fa-css')) {
      const link = document.createElement('link')
      link.id = 'fa-css'
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
      document.head.appendChild(link)
    }
    // LINE LIFF SDK
    let cancelled = false
    let script = document.getElementById('liff-sdk')

    async function resumeLineLogin() {
      try {
        await window.liff.init({ liffId: LIFF_ID })
        if (!cancelled && hasLiffCallback() && window.liff.isLoggedIn()) {
          await finishLineLogin(window.liff)
        }
      } catch (err) {
        if (!cancelled) setError('LINE 登入初始化失敗：' + err.message)
      }
    }

    if (window.liff) {
      resumeLineLogin()
    } else {
      script = document.createElement('script')
      script.id = 'liff-sdk'
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
      script.async = true
      script.onload = resumeLineLogin
      script.onerror = () => {
        if (!cancelled) setError('LINE SDK 載入失敗，請重新整理後再試')
      }
      document.head.appendChild(script)
    }

    return () => { cancelled = true }
  }, [])

  async function handleLineLogin() {
    setLoading(true)
    setError('')
    try {
      const liff = window.liff
      if (!liff) throw new Error('LINE SDK 尚未載入，請稍後再試')
      await liff.init({ liffId: LIFF_ID })
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: `${window.location.origin}/login` })
        return
      }
      await finishLineLogin(liff)
    } catch (err) {
      console.error(err)
      setError('LINE 登入失敗：' + err.message)
    }
    setLoading(false)
  }

  async function finishLineLogin(liff) {
    setLoading(true)
    setError('')
    try {
      const profile = await liff.getProfile()
      const lineId = profile.userId
      const fakeEmail = `line_${lineId}@wnaptcg.line`
      const fakePassword = `line_${lineId}_pwd_wnaptcg`
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: fakeEmail, password: fakePassword })
      if (signInError) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: fakeEmail, password: fakePassword })
        if (signUpError) throw signUpError
        if (data.user) {
          await supabase.from('members').upsert({
            id: data.user.id, email: fakeEmail,
            display_name: profile.displayName, avatar_url: profile.pictureUrl, line_id: lineId,
          }, { onConflict: 'id' })
        }
