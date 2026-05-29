import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleEmailAuth(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        if (data.user) {
          const displayName = name.trim() || email.split('@')[0]
          // 先檢查是否已存在
          const { data: existing } = await supabase.from('members').select('id').eq('id', data.user.id).single()
          if (existing) {
            // 已存在就更新暱稱
            await supabase.from('members').update({ display_name: displayName }).eq('id', data.user.id)
          } else {
            // 不存在就新增
            await supabase.from('members').insert({ id: data.user.id, email, display_name: displayName })
          }
          navigate('/')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        navigate('/')
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? '帳號或密碼錯誤' : err.message)
    }
    setLoading(false)
  }

  const s = {
    wrap: { minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', maxWidth: 390, margin: '0 auto' },
    top: { padding: '48px 32px 32px', textAlign: 'center', borderBottom: '0.5px solid #e5e5e5' },
    logoTop: { fontSize: 22, fontWeight: 600, letterSpacing: '0.08em', color: '#111' },
    logoDivider: { display: 'flex', alignItems: 'center', gap: 8, margin: '4px auto', width: 180 },
    logoLine: { flex: 1, height: 0.5, background: '#ccc' },
    logoX: { fontSize: 13, color: '#999' },
    logoBot: { fontSize: 12, color: '#999', letterSpacing: '0.14em' },
    title: { fontSize: 20, fontWeight: 500, color: '#111', marginTop: 32, marginBottom: 8 },
    sub: { fontSize: 13, color: '#888', lineHeight: 1.6 },
    body: { padding: '28px 24px' },
    input: { width: '100%', padding: '10px 12px', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 14, color: '#111', marginBottom: 10, outline: 'none' },
    btnEmail: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#E24B4A', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4 },
    error: { background: '#FCEBEB', color: '#A32D2D', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
    label: { fontSize: 12, color: '#888', marginBottom: 4, display: 'block' },
    perks: { padding: '0 24px 28px' },
    perksTitle: { fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 12 },
    perksGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
    perkItem: { display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f8f8f8', borderRadius: 8 },
    perkIcon: { width: 28, height: 28, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: '0.5px solid #e5e5e5' },
    perkText: { fontSize: 11, color: '#666', lineHeight: 1.4 },
    footer: { padding: '0 24px 28px', textAlign: 'center' },
    footerNote: { fontSize: 11, color: '#aaa', lineHeight: 1.7 },
  }

  return (
    <div style={s.wrap}>
      <div style={s.top}>
        <div style={s.logoTop}>W/NA PTCG</div>
        <div style={s.logoDivider}>
          <div style={s.logoLine} /><div style={s.logoX}>X</div><div style={s.logoLine} />
        </div>
        <div style={s.logoBot}>HUGO COLLECTIONS</div>
        <div style={s.title}>會員專屬俱樂部</div>
        <div style={s.sub}>登入後即可累積積分、查看戰績牆<br />一起挑戰本月 Boss</div>
      </div>

      <div style={s.body}>
        {error && <div style={s.error}>{error}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 16px' }}>
          <div style={{ flex: 1, height: 0.5, background: '#e5e5e5' }} />
          <div style={{ fontSize: 12, color: '#aaa' }}>{isRegister ? '註冊新帳號' : '使用 Email 登入'}</div>
          <div style={{ flex: 1, height: 0.5, background: '#e5e5e5' }} />
        </div>

        <form onSubmit={handleEmailAuth}>
          {isRegister && (
            <div>
              <label style={s.label}>暱稱</label>
              <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="你的暱稱（登入後顯示用）" />
            </div>
          )}
          <div>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div>
            <label style={s.label}>密碼</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button style={s.btnEmail} type="submit" disabled={loading}>
            {loading ? '處理中...' : isRegister ? '立即註冊' : 'Email 登入'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#888' }}>
          {isRegister ? '已有帳號？' : '還沒有帳號？'}
          <span style={{ color: '#E24B4A', cursor: 'pointer', fontWeight: 500, marginLeft: 4 }}
            onClick={() => { setIsRegister(!isRegister); setError('') }}>
            {isRegister ? '立即登入' : '立即註冊'}
          </span>
        </div>
      </div>

      <div style={s.perks}>
        <div style={s.perksTitle}>加入會員享有</div>
        <div style={s.perksGrid}>
          {[['🏆', '戰績牆開箱紀錄'], ['⭐', '積分升級制度'], ['⚔️', '共同挑戰 Boss'], ['🎁', '每月專屬獎勵']].map(([icon, text]) => (
            <div key={text} style={s.perkItem}>
              <div style={s.perkIcon}>{icon}</div>
              <div style={s.perkText}>{text}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.footer}>
        <div style={s.footerNote}>登入即代表你同意我們的服務條款與隱私權政策</div>
      </div>
    </div>
  )
}
