import React from 'react'
import { useAuth } from '../hooks/useAuth'

export default function TopBar({ right }) {
  const { member } = useAuth()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '0.5px solid #e5e5e5', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}>W/NA PTCG</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, height: 0.5, background: '#ccc' }} />
          <span style={{ fontSize: 9, color: '#999' }}>X</span>
          <div style={{ flex: 1, height: 0.5, background: '#ccc' }} />
        </div>
        <div style={{ fontSize: 8, color: '#999', letterSpacing: '0.1em' }}>HUGO COLLECTIONS</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {right}
        {member && (
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#633806', border: '0.5px solid #FAC775', cursor: 'pointer' }}>
            {member.display_name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </div>
  )
}
