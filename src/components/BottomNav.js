import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { path: '/', icon: 'fa-solid fa-house', label: '首頁' },
  { path: '/wall', icon: 'fa-solid fa-trophy', label: '戰績牆' },
  { path: '/challenge', icon: 'fa-solid fa-shield', label: '挑戰' },
  { path: '/profile', icon: 'fa-solid fa-user', label: '我的' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <div style={{ display: 'flex', borderTop: '0.5px solid #e5e5e5', background: '#fff', position: 'sticky', bottom: 0 }}>
        {NAV.map(n => (
          <div key={n.path} onClick={() => navigate(n.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', gap: 3, cursor: 'pointer' }}>
            <i className={n.icon} style={{ fontSize: 20, color: pathname === n.path ? '#E24B4A' : '#999' }}></i>
            <span style={{ fontSize: 10, color: pathname === n.path ? '#E24B4A' : '#999' }}>{n.label}</span>
          </div>
        ))}
      </div>
    </>
  )
}
