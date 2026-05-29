import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminSettings() {
  const [settings, setSettings] = useState({ points_login: 5, points_streak_bonus: 15, points_purchase_ratio: 1 })
  const [announcement, setAnnouncement] = useState("🔥 本週新開稀有補充包")
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      const s = {}
      data.forEach(d => s[d.key] = JSON.parse(d.value))
      setSettings(s)
    }
  }

  async function handleSave() {
    setSaving(true)
    for (const [key, value] of Object.entries(form)) {
      await supabase.from('settings').upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() })
    }
    if (form.announcement !== undefined) setAnnouncement(form.announcement)
    await fetchSettings()
    setModal(null)
    setSaving(false)
  }

  function openModal(type) {
    if (type === 'points') setForm({ points_login: settings.points_login, points_streak_bonus: settings.points_streak_bonus, points_purchase_ratio: settings.points_purchase_ratio })
    if (type === 'announcement') setForm({ announcement })
    setModal(type)
  }

  const LEVELS = [
    { name: '精靈球', min: 0 }, { name: '超級球', min: 1000 }, { name: '高級球', min: 10000 },
    { name: '豪華球', min: 20000 }, { name: '貴重球', min: 50000 }, { name: '究極球', min: 100000 }, { name: '大師球', min: 300000 },
  ]
  const distColors = ['#888780', '#378ADD', '#E24B4A', '#BA7517', '#854F0B', '#534AB7', '#26215C']

  return (
    <div style={{ padding: 24, position: 'relative' }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#111', marginBottom: 20 }}>系統設定</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* 積分規則 */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>💰 積分規則</div>
            <button onClick={() => openModal('points')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '0.5px solid #ddd', borderRadius: 6, fontSize: 11, color: '#666', background: 'transparent', cursor: 'pointer' }}>✏️ 編輯</button>
          </div>
          {[
            { label: '每日登入', value: `+${settings.points_login} 點` },
            { label: '全勤獎勵', value: `額外 +${settings.points_streak_bonus} 點` },
            { label: '消費積分比例', value: `$1 = ${settings.points_purchase_ratio} 點` },
            { label: '積分有效期限', value: '永久有效' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <div style={{ fontSize: 12, color: '#888' }}>{r.label}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* 會員等級 */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>🏅 會員等級</div>
          </div>
          {LEVELS.map((l, i) => (
            <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f8f8f8', borderRadius: 8, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: distColors[i] }} />
              <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#111' }}>{l.name}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{i === 0 ? '初始會員' : `${l.min.toLocaleString()} 點`}</div>
            </div>
          ))}
        </div>

        {/* 通知設定 */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>🔔 通知設定</div>
          </div>
          {[
            { label: '升級通知', desc: '會員升級時發送通知', on: true },
            { label: 'Boss 重置通知', desc: '每月重置前提醒會員', on: true },
            { label: '全勤提醒', desc: '差 1 天全勤時提醒', on: true },
            { label: '新會員通知', desc: '新會員加入時通知管理員', on: false },
          ].map(n => (
            <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>{n.label}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{n.desc}</div>
              </div>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: n.on ? '#E24B4A' : '#ddd', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: 'white', right: n.on ? 2 : 'auto', left: n.on ? 'auto' : 2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* 帳號安全 */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>🔒 帳號與安全</div>
          </div>
          {[
            { label: '登入方式', value: 'Email + 密碼' },
            { label: '會員登入方式', value: 'Email' },
            { label: '資料庫', value: 'Supabase (Singapore)' },
            { label: '部署平台', value: 'Vercel' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid #f0f0f0' }}>
              <div style={{ fontSize: 12, color: '#888' }}>{r.label}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 公告設定 */}
      <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>📢 首頁公告</div>
          <button onClick={() => { setForm({ announcement }); setModal('announcement') }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '0.5px solid #ddd', borderRadius: 6, fontSize: 11, color: '#666', background: 'transparent', cursor: 'pointer' }}>✏️ 編輯</button>
        </div>
        <div style={{ fontSize: 13, color: '#111', padding: '10px 12px', background: '#f8f8f8', borderRadius: 8 }}>{announcement || '（尚未設定公告）'}</div>
      </div>

      {/* 編輯積分彈出視窗 */}
      {modal === 'points' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 340, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>編輯積分規則</div>
              <span style={{ fontSize: 18, cursor: 'pointer', color: '#aaa' }} onClick={() => setModal(null)}>✕</span>
            </div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>修改後立即生效，不影響既有積分</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 4 }}>每日登入積分</label>
                <input type="number" value={form.points_login} onChange={e => setForm({ ...form, points_login: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ddd', borderRadius: 7, fontSize: 13, color: '#111', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 4 }}>全勤額外獎勵</label>
                <input type="number" value={form.points_streak_bonus} onChange={e => setForm({ ...form, points_streak_bonus: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ddd', borderRadius: 7, fontSize: 13, color: '#111', outline: 'none' }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 4 }}>消費積分比例（$1 = ? 點）</label>
              <input type="number" value={form.points_purchase_ratio} onChange={e => setForm({ ...form, points_purchase_ratio: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ddd', borderRadius: 7, fontSize: 13, color: '#111', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 9, border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, color: '#666', background: 'transparent', cursor: 'pointer' }}>取消</button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: 9, background: saving ? '#ccc' : '#E24B4A', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'white', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '儲存中...' : '儲存設定'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 編輯公告彈出視窗 */}
      {modal === 'announcement' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 340, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>編輯首頁公告</div>
              <span style={{ fontSize: 18, cursor: 'pointer', color: '#aaa' }} onClick={() => setModal(null)}>✕</span>
            </div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>顯示在首頁頂部的公告文字</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 4 }}>公告內容</label>
              <input value={form.announcement || ''} onChange={e => setForm({ ...form, announcement: e.target.value })} placeholder="例：🔥 本週新開稀有補充包"
                style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ddd', borderRadius: 7, fontSize: 13, color: '#111', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: 9, border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, color: '#666', background: 'transparent', cursor: 'pointer' }}>取消</button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: 9, background: saving ? '#ccc' : '#E24B4A', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'white', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
