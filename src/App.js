// src/App.js
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import WallPage from './pages/WallPage'
import ChallengePage from './pages/ChallengePage'
import ProfilePage from './pages/ProfilePage'
import ShopPage from './pages/ShopPage'
import WelcomeOverlay from './components/WelcomeOverlay'
import { InteractionFXStyles } from './components/InteractionFX'
import { ToastProvider } from './components/Toast'
import PageTransition from './components/PageTransition'

function AppLoader() {
  return (
    <div style={{ maxWidth: 390, margin: '0 auto', background: '#fff', minHeight: '100vh' }}>
      <style>{`
        @keyframes shimmer-load {
          0% { background-position: -300px 0 }
          100% { background-position: 300px 0 }
        }
        .sk {
          background: linear-gradient(90deg, #f5f0e8 25%, #faf4e8 50%, #f5f0e8 75%);
          background-size: 600px 100%;
          animation: shimmer-load 1.4s ease-in-out infinite;
          border-radius: 6px;
        }
      `}</style>
      <div style={{ background: 'linear-gradient(135deg,#fff,#fdfaf4,#faf4e8)', padding: '18px 20px 20px', borderBottom: '0.5px solid #f0e8d0', position: 'relative' }}>
        <div className="sk" style={{ width: 120, height: 9, marginBottom: 14 }} />
        <div className="sk" style={{ width: 180, height: 18, marginBottom: 6 }} />
        <div className="sk" style={{ width: 140, height: 18, marginBottom: 14 }} />
        <div className="sk" style={{ width: 90, height: 20, borderRadius: 20 }} />
        <div className="sk" style={{ position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: '50%' }} />
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ border: '0.5px solid #f0e8d0', borderRadius: 10, overflow: 'hidden' }}>
              <div className="sk" style={{ aspectRatio: '3/4', borderRadius: 0 }} />
              <div style={{ padding: '7px 8px 9px' }}>
                <div className="sk" style={{ width: '80%', height: 10, marginBottom: 4 }} />
                <div className="sk" style={{ width: '60%', height: 9 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { member, loading, loginResult, clearLoginResult } = useAuth()
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomed, setWelcomed] = useState(false)
  useEffect(() => {
    if (!loading && member && loginResult && !welcomed) {
      setShowWelcome(true)
    }
  }, [loading, member, loginResult, welcomed])
  if (loading) return <AppLoader />
  if (!member) return <Navigate to="/login" replace />
  return (
    <>
      {showWelcome && (
        <WelcomeOverlay
          loginResult={loginResult}
          member={member}
          onDone={() => {
            setShowWelcome(false)
            setWelcomed(true)
            clearLoginResult()
          }}
        />
      )}
      {children}
    </>
  )
}

// 路由內容抽成內部元件，才能用 useLocation 拿 pathname 當轉場 key
function AppRoutes() {
  const location = useLocation()
  return (
    <PageTransition routeKey={location.pathname}>
      <Routes location={location}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/wall" element={<PrivateRoute><WallPage /></PrivateRoute>} />
        <Route path="/shop" element={<PrivateRoute><ShopPage /></PrivateRoute>} />
        <Route path="/challenge" element={<PrivateRoute><ChallengePage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <InteractionFXStyles />
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
