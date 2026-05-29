import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { path: '/', icon: '🏠', label: '首頁' },
  { path: '/wall', icon: '🏆', label: '戰績牆' },
  { path: '/challenge', icon: '⚔️', label: '挑戰' },
  { path: '/profile', icon: '👤', label: '我的' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={{ display: 'flex', borderTop: '0.5px solid #e5e5e5', background: '#fff', position: 'sticky', bottom: 0 }}>
      {NAV.map(n => (
        <div key={n.path} onClick={() => navigate(n.path)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', gap: 3, cursor: 'pointer' }}>
          <span style={{ fontSize: 20 }}>{n.icon}</span>
          <span style={{ fontSize: 10, color: pathname === n.path ? '#E24B4A' : '#999' }}>{n.label}</span>
        </div>
      ))}
    </div>
  )
}
