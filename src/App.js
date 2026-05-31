import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import WallPage from './pages/WallPage'
import ChallengePage from './pages/ChallengePage'
import ProfilePage from './pages/ProfilePage'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import AdminMembers from './admin/AdminMembers'
import AdminCards from './admin/AdminCards'
import AdminBoss from './admin/AdminBoss'
import AdminSettings from './admin/AdminSettings'
import WelcomeOverlay from './components/WelcomeOverlay'

// ── 頁面淡入過場 Wrapper ──────────────────────────────
function PageTransition({ children }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transKey, setTransKey] = useState(location.pathname)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (location.pathname === transKey) return
    // 淡出
    setOpacity(0)
    const t1 = setTimeout(() => {
      setDisplayChildren(children)
      setTransKey(location.pathname)
      // 淡入
      const t2 = setTimeout(() => setOpacity(1), 20)
      return () => clearTimeout(t2)
    }, 160)
    return () => clearTimeout(t1)
  }, [location.pathname, children])

  return (
    <div style={{
      opacity,
      transition: opacity === 0 ? 'opacity 0.16s ease' : 'opacity 0.22s ease',
      minHeight: '100vh',
    }}>
      {displayChildren}
    </div>
  )
}

// ── Skeleton Loading ──────────────────────────────────
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
      <div style={{ background: 'linear-gradient(135deg,#fff,#fdfaf4,#faf4e8)', padding: '18px 20px 20px', borderBottom: '0.5px solid #f0e8d0' }}>
        <div className="sk" style={{ width: 120, height: 9, marginBottom: 14 }} />
        <div className="sk" style={{ width: 180, height: 18, marginBottom: 6 }} />
        <div className="sk" style={{ width: 140, height: 18, marginBottom: 14 }} />
        <div className="sk" style={{ width: 90, height: 20, borderRadius: 20 }} />
        <div className="sk" style={{ position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: '50%' }} />
      </div>
      <div style={{ padding: '10px 20px', borderBottom: '0.5px solid #f5f0e8', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div className="sk" style={{ width: 32, height: 16, borderRadius: 3 }} />
        <div className="sk" style={{ flex: 1, height: 11 }} />
      </div>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f5f0e8' }}>
        <div className="sk" style={{ width: 60, height: 11, marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 0, border: '0.5px solid #f0e8d0', borderRadius: 8, overflow: 'hidden' }}>
          <div className="sk" style={{ width: 80, height: 64, borderRadius: 0, flexShrink: 0 }} />
          <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="sk" style={{ width: 50, height: 8 }} />
            <div className="sk" style={{ width: '90%', height: 11 }} />
            <div className="sk" style={{ width: '70%', height: 11 }} />
            <div className="sk" style={{ width: 60, height: 8 }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="sk" style={{ width: 70, height: 14 }} />
          <div className="sk" style={{ width: 40, height: 12 }} />
        </div>
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

// ── PrivateRoute ──────────────────────────────────────
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

function AdminRoute({ children }) {
  const { member, loading } = useAuth()
  if (loading) return <AppLoader />
  if (!member) return <Navigate to="/login" replace />
  if (!member.is_admin) return <Navigate to="/" replace />
  return children
}

// ── 主 App ────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}

function AppInner() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/wall" element={<PrivateRoute><WallPage /></PrivateRoute>} />
        <Route path="/challenge" element={<PrivateRoute><ChallengePage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="cards" element={<AdminCards />} />
          <Route path="boss" element={<AdminBoss />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </PageTransition>
  )
}
