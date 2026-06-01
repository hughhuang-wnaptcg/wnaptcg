import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LIFF_ID = '2010232634-k2C4gSOg'

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
        if (!cancelled && window.liff.isLoggedIn()) {
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
      if (!liff.isLoggedIn()) { liff.login(); return }
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
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('members').update({ display_name: profile.displayName, avatar_url: profile.pictureUrl }).eq('id', user.id)
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
    <div style={S.page}>
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%) rotate(35deg)} 100%{transform:translateX(300%) rotate(35deg)} }
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(186,117,23,0.25)} 50%{box-shadow:0 0 0 10px rgba(186,117,23,0)} }
        .line-btn:hover:not(:disabled){filter:brightness(1.05)} 
        .line-btn:active:not(:disabled){transform:scale(0.97)}
        .benefit-card:hover{background:linear-gradient(135deg,#faf4e8,#fff8ee)!important;border-color:#FAC775!important}
      `}</style>

      {/* 背景光暈 */}
      <div style={S.glow1}/><div style={S.glow2}/><div style={S.glow3}/>
      {/* 金色橫線 */}
      <div style={S.hline1}/><div style={S.hline2}/><div style={S.hline3}/>
      {/* 星星點點 */}
      {[[8,15],[22,78],[45,8],[12,90],[60,22],[78,65],[90,40],[35,55],[5,50],[88,12]].map(([t,l],i)=>(
        <div key={i} style={{position:'fixed',top:`${t}%`,left:`${l}%`,width:i%3===0?3:2,height:i%3===0?3:2,borderRadius:'50%',background:'#BA7517',opacity:0.12+(i%4)*0.07,pointerEvents:'none'}}/>
      ))}

      <div style={S.inner}>

        {/* 插圖圓圈 */}
        <div style={S.illustWrap}>
          <div style={S.illustRing}>
            <div style={S.illustCircle}>
              <img
                src="https://lgsrcxxrifhdsdvnaloh.supabase.co/storage/v1/object/public/card-images/assets/mascot.png"
                alt="W/NA PTCG mascot"
                style={S.illustImg}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
              />
              {/* fallback：若圖片路徑不對先顯示這個 */}
              <div style={{...S.illustFallback, display:'none'}}>
                <i className="fa-solid fa-user" style={{fontSize:36,color:'#BA7517',opacity:0.3}}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div style={S.logoSection}>
          <div style={S.logoText}>W/NA PTCG</div>
          <div style={S.logoDivider}>
            <div style={S.divLine}/><div style={S.divDot}/><div style={S.divLine}/>
          </div>
          <div style={S.logoSub}>HUGO COLLECTIONS</div>
        </div>

        {/* 主標題 */}
        <div style={S.heroTitle}>會員專屬俱樂部</div>
        <div style={S.heroDesc}>登入後即可累積積分<br/>查看戰績牆、一起挑戰本月 Boss</div>

        {/* 等級點點 */}
        <div style={S.levelRow}>
          {[['精靈球','#888780'],['超級球','#378ADD'],['高級球','#E24B4A'],['豪華球','#BA7517'],['大師球','#534AB7']].map(([name,color])=>(
            <div key={name} style={S.levelDot} title={name}>
              <div style={{width:6,height:6,borderRadius:'50%',background:color,opacity:0.7}}/>
            </div>
          ))}
          <span style={S.levelHint}>7 種球種等級</span>
        </div>

        {/* 福利卡片 */}
        <div style={S.grid}>
          {BENEFITS.map(({icon,text},i)=>(
            <div key={text} className="benefit-card" style={{...S.benefitCard,animationDelay:`${i*0.07}s`}}>
              <div style={S.benefitIcon}>
                <i className={`fa-solid ${icon}`} style={{fontSize:14,color:'#BA7517'}}></i>
              </div>
              <div style={S.benefitText}>{text}</div>
            </div>
          ))}
        </div>

        {/* 錯誤 */}
        {error && (
          <div style={S.errorBox}>
            <i className="fa-solid fa-circle-exclamation" style={{fontSize:13,color:'#A32D2D'}}></i>
            {error}
          </div>
        )}

        {/* LINE 登入按鈕 */}
        <button className="line-btn" onClick={handleLineLogin} disabled={loading} style={{...S.lineBtn,...(loading?S.lineBtnOff:{})}}>
          {!loading && <div style={S.shimmer}/>}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.494.25l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          <span style={{fontSize:15,fontWeight:600,letterSpacing:'0.03em'}}>
            {loading ? 'LINE 登入中...' : '使用 LINE 登入'}
          </span>
          {loading && <i className="fa-solid fa-spinner fa-spin" style={{fontSize:13,opacity:0.8}}></i>}
        </button>

        {/* 安全登入裝飾 */}
        <div style={S.decoRow}>
          <div style={S.decoLine}/><span style={S.decoText}>安全登入</span><div style={S.decoLine}/>
        </div>

        {/* 底部 */}
        <div style={S.footer}>
          <i className="fa-solid fa-lock" style={{fontSize:10,color:'#BA7517',opacity:0.45}}></i>
          <span>登入即代表您同意我們的服務條款與隱私權政策</span>
        </div>

      </div>
    </div>
  )
}

const S = {
  page: { minHeight:'100vh', maxWidth:390, margin:'0 auto', background:'linear-gradient(160deg,#ffffff 0%,#fdfaf4 45%,#faf4e8 80%,#f5ede0 100%)', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' },
  glow1: { position:'fixed', top:-80, right:-80, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(186,117,23,0.10) 0%,transparent 70%)', pointerEvents:'none' },
  glow2: { position:'fixed', bottom:-60, left:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(186,117,23,0.07) 0%,transparent 70%)', pointerEvents:'none' },
  glow3: { position:'fixed', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(250,199,117,0.06) 0%,transparent 70%)', pointerEvents:'none' },
  hline1: { position:'fixed', top:'20%', left:0, right:0, height:0.5, background:'linear-gradient(90deg,transparent,rgba(186,117,23,0.14),transparent)', pointerEvents:'none' },
  hline2: { position:'fixed', top:'60%', left:0, right:0, height:0.5, background:'linear-gradient(90deg,transparent,rgba(186,117,23,0.09),transparent)', pointerEvents:'none' },
  hline3: { position:'fixed', top:'82%', left:0, right:0, height:0.5, background:'linear-gradient(90deg,transparent,rgba(186,117,23,0.07),transparent)', pointerEvents:'none' },
  inner: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 28px 36px', animation:'fadeUp 0.55s ease both' },

  // 插圖圓圈
  illustWrap: { marginBottom:20, animation:'float 4s ease-in-out infinite' },
  illustRing: { width:100, height:100, borderRadius:'50%', border:'1px solid rgba(186,117,23,0.22)', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.6)', boxShadow:'0 4px 24px rgba(186,117,23,0.10)', animation:'pulse-ring 3.5s ease-in-out infinite' },
  illustCircle: { width:84, height:84, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' },
  illustImg: { width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' },
  illustFallback: { width:'100%', height:'100%', alignItems:'center', justifyContent:'center', position:'absolute', inset:0 },

  // Logo
  logoSection: { display:'flex', flexDirection:'column', alignItems:'center', marginBottom:20 },
  logoText: { fontSize:22, fontWeight:700, letterSpacing:'0.12em', color:'#1a1a1a' },
  logoDivider: { display:'flex', alignItems:'center', gap:8, margin:'5px 0', width:160 },
  divLine: { flex:1, height:0.5, background:'linear-gradient(90deg,transparent,#BA7517,transparent)', opacity:0.4 },
  divDot: { width:4, height:4, borderRadius:'50%', background:'#BA7517', opacity:0.5 },
  logoSub: { fontSize:10, color:'#BA7517', letterSpacing:'0.18em', fontWeight:600, opacity:0.65 },

  heroTitle: { fontSize:22, fontWeight:500, color:'#1a1a1a', letterSpacing:'0.04em', marginBottom:10, textAlign:'center', lineHeight:1.3 },
  heroDesc: { fontSize:13, color:'#888', lineHeight:1.85, textAlign:'center', marginBottom:20 },

  levelRow: { display:'flex', alignItems:'center', gap:7, marginBottom:20 },
  levelDot: { width:18, height:18, borderRadius:'50%', background:'#fdfaf4', border:'0.5px solid rgba(186,117,23,0.2)', display:'flex', alignItems:'center', justifyContent:'center' },
  levelHint: { fontSize:10, color:'#BA7517', opacity:0.6, fontWeight:500, letterSpacing:'0.04em', marginLeft:4 },

  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, width:'100%', marginBottom:24 },
  benefitCard: { display:'flex', alignItems:'center', gap:9, padding:'11px 12px', background:'#fff', border:'0.5px solid #f0e8d0', borderRadius:10, boxShadow:'0 1px 6px rgba(186,117,23,0.04)', transition:'all 0.2s ease', animation:'fadeUp 0.5s ease both' },
  benefitIcon: { width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#FAEEDA,#FFF3D0)', border:'0.5px solid rgba(186,117,23,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  benefitText: { fontSize:11, color:'#555', lineHeight:1.4 },

  errorBox: { display:'flex', alignItems:'center', gap:7, background:'#FCEBEB', color:'#A32D2D', padding:'10px 14px', borderRadius:8, fontSize:12, width:'100%', marginBottom:12, border:'0.5px solid #F09595' },

  lineBtn: { display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#06C755', color:'white', border:'none', borderRadius:14, padding:'15px 32px', fontSize:15, fontWeight:600, cursor:'pointer', width:'100%', boxShadow:'0 4px 16px rgba(6,199,85,0.28)', transition:'all 0.2s ease', position:'relative', overflow:'hidden', marginBottom:14 },
  lineBtnOff: { background:'#ccc', cursor:'not-allowed', boxShadow:'none' },
  shimmer: { position:'absolute', top:0, left:0, width:'40%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)', animation:'shimmer 2.5s ease-in-out infinite', pointerEvents:'none' },

  decoRow: { display:'flex', alignItems:'center', gap:10, width:'80%', marginBottom:18 },
  decoLine: { flex:1, height:0.5, background:'linear-gradient(90deg,transparent,rgba(186,117,23,0.25),transparent)' },
  decoText: { fontSize:10, color:'#BA7517', opacity:0.55, letterSpacing:'0.08em', fontWeight:500, whiteSpace:'nowrap' },

  footer: { display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#bbb', textAlign:'center', lineHeight:1.5 },
}
