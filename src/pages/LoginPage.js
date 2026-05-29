import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LIFF_ID = '2010232634-k2C4gSOg'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
    script.async = true
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [])

  async function handleLineLogin() {
    setLoading(true)
    setError('')
    try {
      const liff = window.liff
      if (!liff) throw new Error('LINE SDK 尚未載入，請稍後再試')

      await liff.init({ liffId: LIFF_ID })

      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }

      const profile = await liff.getProfile()
      const lineId = profile.userId
      const displayName = profile.displayName
      const pictureUrl = profile.pictureUrl

      const fakeEmail = `line_${lineId}@wnaptcg.line`
      const fakePassword = `line_${lineId}_pwd_wnaptcg`

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: fakeEmail, password: fakePassword })

      if (signInError) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: fakeEmail, password: fakePassword })
        if (signUpError) throw signUpError
        if (data.user) {
          await supabase.from('members').upsert({
            id: data.user.id,
            email: fakeEmail,
            display_name: displayName,
            avatar_url: pictureUrl,
            line_id: lineId,
          }, { onConflict: 'id' })
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('members').update({
            display_name: displayName,
            avatar_url: pictureUrl,
          }).eq('id', user.id)
        }
      }

      navigate('/')
    } catch (err) {
      console.error(err)
      setError('LINE 登入失敗：' + err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', maxWidth: 390, margin: '0 auto' }}>

      {/* Logo */}
      <div style={{ padding: '60px 32px 40px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '0.08em', color: '#111' }}>W/NA PTCG</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px auto', width: 180 }}>
          <div style={{ flex: 1, height: 0.5, background: '#ccc' }} />
          <div style={{ fontSize: 13, color: '#999' }}>X</div>
          <div style={{ flex: 1, height: 0.5, background: '#ccc' }} />
        </div>
        <div style={{ fontSize: 12, color: '#999', letterSpacing: '0.14em', marginBottom: 40 }}>HUGO COLLECTIONS</div>

        <div style={{ fontSize: 22, fontWeight: 500, color: '#111', marginBottom: 10 }}>會員專屬俱樂部</div>
        <div style={{ fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 48, textAlign: 'center' }}>
          登入後即可累積積分<br />查看戰績牆、一起挑戰本月 Boss
        </div>

        {error && (
          <div style={{ background: '#FCEBEB', color: '#A32D2D', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16, width: '100%', maxWidth: 300 }}>
            {error}
          </div>
        )}

        <button onClick={handleLineLogin} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: loading ? '#ccc' : '#06C755', color: 'white', border: 'none', borderRadius: 12, padding: '16px 32px', fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', width: '100%', maxWidth: 300 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.494.25l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          {loading ? 'LINE 登入中...' : '使用 LINE 登入'}
        </button>
      </div>

      {/* 底部福利 */}
      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 14 }}>加入會員享有</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['🏆', '戰績牆開箱紀錄'], ['⭐', '積分升級制度'], ['⚔️', '共同挑戰 Boss'], ['🎁', '每月專屬獎勵']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f8f8f8', borderRadius: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: '0.5px solid #e5e5e5' }}>{icon}</div>
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#aaa' }}>
          登入即代表您同意我們的服務條款與隱私權政策
        </div>
      </div>
    </div>
  )
}
