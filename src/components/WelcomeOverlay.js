import React, { useEffect, useState } from 'react'
import { PokeballIcon } from '../lib/pokeballs'
import { playLevelUpSound, playPointsSound, vibrate, VIBRATE } from '../lib/haptics'

export default function WelcomeOverlay({ loginResult, member, onDone }) {
  const [phase, setPhase] = useState('enter')
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('content'), 100)
    const steps = buildSteps(loginResult)
    let current = 0
    const timers = [t1]

    const advance = () => {
      current++
      if (current < steps.length) {
        setStep(current)
        // 播放對應音效
        const s = steps[current]
        if (s.type === 'points') { playPointsSound(); vibrate(VIBRATE.success) }
        if (s.type === 'levelup') { playLevelUpSound(); vibrate(VIBRATE.levelUp) }
        timers.push(setTimeout(advance, 2400))
      } else {
        timers.push(setTimeout(() => {
          setPhase('exit')
          setTimeout(onDone, 500)
        }, 1800))
      }
    }
    timers.push(setTimeout(advance, 2200))
    return () => timers.forEach(clearTimeout)
  }, [])

  const steps = buildSteps(loginResult)
  const current = steps[step] || steps[0]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'linear-gradient(160deg,#ffffff 0%,#fdfaf4 50%,#faf4e8 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      maxWidth: 390, margin: '0 auto',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
      opacity: phase === 'content' ? 1 : 0,
      transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
      pointerEvents: phase === 'exit' ? 'none' : 'all',
    }}>
      <style>{`
        @keyframes pop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes countUp { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
        @keyframes numberPop {
          0%   { transform: scale(0.4) translateY(20px); opacity: 0; }
          50%  { transform: scale(1.25) translateY(-6px); opacity: 1; }
          70%  { transform: scale(0.95) translateY(2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes shimmerGold {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>

      {/* 背景裝飾 */}
      <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(186,117,23,0.09) 0%,transparent 70%)'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(186,117,23,0.06) 0%,transparent 70%)'}}/>
      {[[8,15],[22,78],[45,8],[88,12],[60,85],[35,55]].map(([t,l],i)=>(
        <div key={i} style={{position:'absolute',top:`${t}%`,left:`${l}%`,width:i%2===0?3:2,height:i%2===0?3:2,borderRadius:'50%',background:'#BA7517',opacity:0.15+i*0.05}}/>
      ))}

      {/* 步驟指示 */}
      {steps.length > 1 && (
        <div style={{position:'absolute',bottom:80,display:'flex',gap:6}}>
          {steps.map((_,i)=>(
            <div key={i} style={{width:i===step?20:6,height:6,borderRadius:3,background:i===step?'#BA7517':'#f0e8d0',transition:'all 0.3s ease'}}/>
          ))}
        </div>
      )}

      {/* 跳過 */}
      <div onClick={onDone} style={{position:'absolute',top:22,right:20,fontSize:11,color:'#bbb',cursor:'pointer',padding:'4px 8px'}}>跳過</div>

      {/* 主內容 */}
      <div key={step} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0,padding:'0 40px',textAlign:'center'}}>
        {current.type === 'welcome'   && <WelcomeStep member={member} loginResult={loginResult}/>}
        {current.type === 'points'    && <PointsStep loginResult={loginResult}/>}
        {current.type === 'levelup'   && <LevelUpStep loginResult={loginResult}/>}
        {current.type === 'newmember' && <NewMemberStep member={member}/>}
      </div>
    </div>
  )
}

// ─── 歡迎步驟 ────────────────────────────────────────
function WelcomeStep({ member, loginResult }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '早安' : hour < 18 ? '午安' : '晚安'
  return (
    <>
      <div style={{fontSize:64,marginBottom:16,animation:'float 3s ease-in-out infinite'}}>
        {loginResult?.isNewMember ? '🎉' : hour < 12 ? '☀️' : hour < 18 ? '⛅' : '🌙'}
      </div>
      <div style={{fontSize:13,color:'#BA7517',fontWeight:600,letterSpacing:'0.1em',marginBottom:10,opacity:0.7,animation:'slideUp 0.5s ease both'}}>
        W/NA PTCG × HUGO COLLECTIONS
      </div>
      <div style={{fontSize:24,fontWeight:500,color:'#1a1a1a',marginBottom:8,animation:'slideUp 0.5s 0.1s ease both',lineHeight:1.3}}>
        {loginResult?.isNewMember ? '歡迎加入！' : `${greeting}，`}
        {!loginResult?.isNewMember && <span style={{color:'#BA7517'}}>{member?.display_name}</span>}
      </div>
      {loginResult?.isNewMember && (
        <div style={{fontSize:16,color:'#BA7517',marginBottom:6,animation:'slideUp 0.5s 0.15s ease both'}}>
          {member?.display_name}
        </div>
      )}
      <div style={{fontSize:13,color:'#999',lineHeight:1.8,animation:'slideUp 0.5s 0.2s ease both'}}>
        {loginResult?.isNewMember ? '很高興認識你！\n開始你的 PTCG 收藏之旅吧' : '今天也要一起玩卡牌嗎？'}
      </div>
    </>
  )
}

// ─── 積分通知步驟（數字跳動強化版）────────────────────
function PointsStep({ loginResult }) {
  const [displayPoints, setDisplayPoints] = useState(0)
  const target = loginResult?.pointsEarned || 0

  // 數字從 0 滾動到目標值
  useEffect(() => {
    if (target <= 0) return
    const duration = 800
    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplayPoints(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target])

  return (
    <>
      {/* 外圈脈衝 */}
      <div style={{position:'relative',marginBottom:20}}>
        <div style={{position:'absolute',inset:-12,borderRadius:'50%',border:'1.5px solid #FAC775',animation:'ringPulse 1.2s ease-out infinite'}}/>
        <div style={{position:'absolute',inset:-12,borderRadius:'50%',border:'1.5px solid #FAC775',animation:'ringPulse 1.2s 0.4s ease-out infinite'}}/>
        <div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#FAEEDA,#FFF3D0)',border:'1.5px solid #FAC775',display:'flex',alignItems:'center',justifyContent:'center',animation:'pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',boxShadow:'0 4px 20px rgba(186,117,23,0.2)'}}>
          <i className="fa-solid fa-star" style={{fontSize:36,color:'#BA7517'}}></i>
        </div>
      </div>

      <div style={{fontSize:13,color:'#BA7517',fontWeight:600,letterSpacing:'0.08em',marginBottom:12,animation:'slideUp 0.4s 0.1s ease both'}}>
        今日登入獎勵
      </div>

      {/* 跳動數字 */}
      <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:loginResult?.bonusEarned>0?12:0}}>
        <span style={{
          fontSize:56,fontWeight:800,lineHeight:1,
          background:'linear-gradient(135deg,#BA7517 0%,#FAC775 50%,#BA7517 100%)',
          backgroundSize:'200% auto',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          animation:'numberPop 0.6s 0.2s cubic-bezier(0.34,1.56,0.64,1) both, shimmerGold 2s 0.8s linear infinite',
        }}>
          +{displayPoints}
        </span>
        <span style={{fontSize:20,color:'#BA7517',opacity:0.7,animation:'slideUp 0.4s 0.5s ease both'}}>點</span>
      </div>

      {loginResult?.bonusEarned > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#FAEEDA,#FFF3D0)',border:'0.5px solid #FAC775',borderRadius:20,padding:'6px 14px',marginBottom:6,animation:'slideUp 0.4s 0.5s ease both'}}>
          <i className="fa-solid fa-fire" style={{fontSize:13,color:'#E24B4A'}}></i>
          <span style={{fontSize:12,color:'#8B5A00',fontWeight:500}}>全勤獎勵 +{loginResult.bonusEarned} 點</span>
        </div>
      )}

      <div style={{fontSize:12,color:'#bbb',marginTop:8,animation:'slideUp 0.4s 0.6s ease both'}}>
        連續登入 {loginResult?.newStreak || 1} 天
      </div>
    </>
  )
}

// ─── 升級步驟（音效 + 震動已在父層觸發）─────────────
function LevelUpStep({ loginResult }) {
  return (
    <>
      {/* 煙火粒子 */}
      {[0,60,120,180,240,300].map((deg,i)=>(
        <div key={i} style={{position:'absolute',top:'30%',left:'50%',width:7,height:7,borderRadius:'50%',
          background:['#BA7517','#E24B4A','#378ADD','#06C755','#FAC775','#534AB7'][i],
          transform:`rotate(${deg}deg) translateY(-60px)`,
          animation:`sparkle 0.9s ${i*0.08}s ease both`}}/>
      ))}
      {/* 第二輪煙火 */}
      {[30,90,150,210,270,330].map((deg,i)=>(
        <div key={`b${i}`} style={{position:'absolute',top:'30%',left:'50%',width:5,height:5,borderRadius:'50%',
          background:['#FAC775','#BA7517','#E24B4A','#378ADD','#06C755','#534AB7'][i],
          transform:`rotate(${deg}deg) translateY(-40px)`,
          animation:`sparkle 0.9s ${0.15+i*0.08}s ease both`}}/>
      ))}

      <div style={{position:'relative',marginBottom:16}}>
        <div style={{position:'absolute',inset:-16,borderRadius:'50%',border:'2px solid #BA7517',animation:'ringPulse 1s ease-out infinite'}}/>
        <div style={{animation:'pop 0.7s cubic-bezier(0.34,1.56,0.64,1) both'}}>
          <PokeballIcon level={loginResult?.newLevel} size={80}/>
        </div>
      </div>

      <div style={{
        fontSize:13,fontWeight:700,letterSpacing:'0.1em',marginBottom:10,
        background:'linear-gradient(135deg,#BA7517,#FAC775,#BA7517)',
        backgroundSize:'200% auto',
        WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
        animation:'slideUp 0.4s 0.2s ease both, shimmerGold 2s 0.6s linear infinite',
      }}>
        🎊 等級提升！
      </div>

      <div style={{fontSize:22,fontWeight:500,color:'#1a1a1a',marginBottom:6,animation:'slideUp 0.4s 0.3s ease both'}}>
        <span style={{color:'#999',textDecoration:'line-through',fontSize:15}}>{loginResult?.oldLevel}</span>
        <span style={{margin:'0 10px',color:'#BA7517'}}>→</span>
        <span style={{
          color:'#BA7517',fontWeight:700,
          background:'linear-gradient(135deg,#BA7517,#FAC775)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
        }}>{loginResult?.newLevel}</span>
      </div>
      <div style={{fontSize:13,color:'#999',animation:'slideUp 0.4s 0.4s ease both'}}>
        恭喜升級到新等級！繼續累積積分吧
      </div>
    </>
  )
}

// ─── 新會員引導步驟 ───────────────────────────────────
function NewMemberStep({ member }) {
  const features = [
    { icon:'fa-trophy', text:'戰績牆', desc:'記錄你的開包高光' },
    { icon:'fa-shield', text:'共同挑戰', desc:'和大家一起打 Boss' },
    { icon:'fa-star',   text:'積分制度', desc:'消費登入都能累積' },
  ]
  return (
    <>
      <div style={{fontSize:13,color:'#BA7517',fontWeight:600,letterSpacing:'0.08em',marginBottom:16,animation:'slideUp 0.4s ease both'}}>
        這裡有什麼？
      </div>
      {features.map(({icon,text,desc},i)=>(
        <div key={text} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'10px 0',borderBottom:i<features.length-1?'0.5px solid #f5f0e8':'none',animation:`slideUp 0.4s ${i*0.1}s ease both`}}>
          <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#FAEEDA,#FFF3D0)',border:'0.5px solid rgba(186,117,23,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className={`fa-solid ${icon}`} style={{fontSize:16,color:'#BA7517'}}></i>
          </div>
          <div style={{textAlign:'left'}}>
            <div style={{fontSize:13,fontWeight:500,color:'#111'}}>{text}</div>
            <div style={{fontSize:11,color:'#999',marginTop:1}}>{desc}</div>
          </div>
        </div>
      ))}
    </>
  )
}

function buildSteps(loginResult) {
  if (!loginResult) return [{ type: 'welcome' }]
  const steps = [{ type: 'welcome' }]
  if (loginResult.pointsEarned > 0) steps.push({ type: 'points' })
  if (loginResult.levelUp) steps.push({ type: 'levelup' })
  if (loginResult.isNewMember) steps.push({ type: 'newmember' })
  return steps
}
