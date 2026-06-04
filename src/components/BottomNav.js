import React, { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { playClickSound, vibrate, VIBRATE } from '../lib/haptics'

const NAV = [
  { path: '/',         icon: 'fa-solid fa-house',       label: '首頁' },
  { path: '/wall',     icon: 'fa-solid fa-trophy',      label: '戰績牆' },
  { path: '/shop',     icon: 'fa-solid fa-store',       label: '消費區' },
  { path: '/challenge',icon: 'fa-solid fa-shield',      label: '挑戰' },
  { path: '/profile',  icon: 'fa-solid fa-user',        label: '我的' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [ripples, setRipples] = useState({})
  const [pressedPath, setPressedPath] = useState(null)

  const handleNav = useCallback((path, e) => {
    if (pathname === path) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(prev => ({ ...prev, [path]: { x, y, id } }))
    setTimeout(() => setRipples(prev => { const n = {...prev}; delete n[path]; return n }), 600)
    playClickSound()
    vibrate(VIBRATE.light)
    navigate(path)
  }, [pathname, navigate])

  const handlePressStart = (path) => setPressedPath(path)
  const handlePressEnd = () => setPressedPath(null)

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <style>{`
        @keyframes rippleExpand {
          from { transform: scale(0); opacity: 0.35; }
          to { transform: scale(3.5); opacity: 0; }
        }
        @keyframes navIconBounce {
          0%   { transform: scale(1) translateY(0); }
          35%  { transform: scale(1.25) translateY(-4px); }
          60%  { transform: scale(0.92) translateY(1px); }
          80%  { transform: scale(1.06) translateY(-1px); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes navLabelSlide {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        display: 'flex',
        borderTop: '0.5px solid #f5f0e8',
        background: '#fff',
        position: 'sticky',
        bottom: 0,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {NAV.map(n => {
          const active = pathname === n.path
          const pressed = pressedPath === n.path
          const ripple = ripples[n.path]
          return (
            <div
              key={n.path}
              onClick={e => handleNav(n.path, e)}
              onMouseDown={() => handlePressStart(n.path)}
              onMouseUp={handlePressEnd}
              onTouchStart={() => handlePressStart(n.path)}
              onTouchEnd={handlePressEnd}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 4px', gap: 3, cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
                transform: pressed ? 'scale(0.92)' : 'scale(1)',
                transition: 'transform 0.12s ease',
                userSelect: 'none', WebkitUserSelect: 'none',
              }}>
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 32, height: 2,
                  background: 'linear-gradient(90deg,transparent,#BA7517,transparent)',
                  borderRadius: '0 0 4px 4px',
                }} />
              )}
              {ripple && (
                <div style={{
                  position: 'absolute',
                  left: ripple.x, top: ripple.y,
                  width: 40, height: 40,
                  marginLeft: -20, marginTop: -20,
                  borderRadius: '50%',
                  background: '#BA7517',
                  pointerEvents: 'none',
                  animation: 'rippleExpand 0.6s ease-out forwards',
                }} />
              )}
              <i
                className={n.icon}
                style={{
                  fontSize: 19,
                  color: active ? '#BA7517' : '#ccc',
                  animation: active ? 'navIconBounce 0.45s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                  transition: 'color 0.2s ease',
                }}
              />
              <span style={{
                fontSize: 9,
                color: active ? '#BA7517' : '#ccc',
                transition: 'color 0.2s ease',
                animation: active ? 'navLabelSlide 0.3s 0.05s ease both' : 'none',
              }}>
                {n.label}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
