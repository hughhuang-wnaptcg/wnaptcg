import React from 'react'
import { useAuth } from '../hooks/useAuth'

export default function TopBar({ right }) {
  const { member } = useAuth()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderBottom: '0.5px solid #f5f0e8',
      background: '#fff', position: 'sticky', top: 0, zIndex: 10
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: '#111' }}>W/NA PTCG</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, height: 0.5, background: '#D4A94A', opacity: 0.5 }} />
          <span style={{ fontSize: 9, color: '#BA7517' }}>X</span>
          <div style={{ flex: 1, height: 0.5, background: '#D4A94A', opacity: 0.5 }} />
        </div>
        <div style={{ fontSize: 8, color: '#BA7517', letterSpacing: '0.1em', opacity: 0.7 }}>HUGO COLLECTIONS</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {right}
        {member && (
          member.avatar_url ? (
            <img src={member.avatar_url} alt={member.display_name}
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid #FAC775', cursor: 'pointer' }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#FAEEDA,#FFF3D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#633806', border: '0.5px solid #FAC775', cursor: 'pointer' }}>
              {member.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
          )
        )}
      </div>
    </div>
  )
}
