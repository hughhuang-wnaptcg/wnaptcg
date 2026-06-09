// src/lib/sounds.js
// ── 全站唯一音效管理中心 ──────────────────────────────
// 使用方式：import { playSound, SoundToggle } from '../lib/sounds'
// 播放音效：playSound('order_success')
// 開關元件：<SoundToggle />

import React, { useState, useEffect } from 'react'

const STORAGE_KEY = 'wna_sound_enabled'

export function isSoundEnabled() {
  try { return localStorage.getItem(STORAGE_KEY) !== 'false' } catch { return true }
}

export function setSoundEnabled(val) {
  try { localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false') } catch {}
}

function getCtx() {
  try { return new (window.AudioContext || window.webkitAudioContext)() } catch { return null }
}

// ── 音效定義表 ────────────────────────────────────────
const SOUNDS = {

  // 成功類

  order_success: (ctx) => {
    [[0, 660], [0.1, 880], [0.2, 1100]].forEach(([t, freq]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(freq, ctx.currentTime + t)
      g.gain.setValueAtTime(0.25, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.18)
    })
    return 500
  },

  shop_redeem_success: (ctx) => {
    // 商城兌換：上升雙音 + 餘韻
    [[0, 880, 0.22], [0.15, 1320, 0.3]].forEach(([t, freq, dur]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(freq, ctx.currentTime + t)
      g.gain.setValueAtTime(0.28, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + dur)
    })
    return 600
  },

  checkin_success: (ctx) => {
    // 每日簽到：輕快兩聲
    [[0, 880], [0.12, 1100]].forEach(([t, freq]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'triangle'
      o.frequency.setValueAtTime(freq, ctx.currentTime + t)
      g.gain.setValueAtTime(0.22, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.15)
    })
    return 350
  },

  points_earned: (ctx) => {
    // 獲得積分：短促清脆單音
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(1046, ctx.currentTime)
    o.frequency.setValueAtTime(1320, ctx.currentTime + 0.05)
    g.gain.setValueAtTime(0.2, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.2)
    return 300
  },

  boss_defeated: (ctx) => {
    // Boss 討伐成功：史詩感，三段上升
    [[0, 330, 0.3], [0.18, 440, 0.3], [0.36, 660, 0.5], [0.55, 880, 0.6]].forEach(([t, freq, dur]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = t < 0.4 ? 'sawtooth' : 'sine'
      o.frequency.setValueAtTime(freq, ctx.currentTime + t)
      g.gain.setValueAtTime(0.28, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + dur)
    })
    return 1200
  },

  rare_reward: (ctx) => {
    // 稀有獎勵：閃亮上升音階
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const t = i * 0.08
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(freq, ctx.currentTime + t)
      g.gain.setValueAtTime(0.22, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.25)
    })
    return 800
  },

  // 錯誤類

  error_general: (ctx) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'square'
    o.frequency.setValueAtTime(220, ctx.currentTime)
    o.frequency.setValueAtTime(180, ctx.currentTime + 0.1)
    g.gain.setValueAtTime(0.18, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.25)
    return 350
  },

  error_points: (ctx) => {
    // 點數不足：兩聲下降
    [[0, 330], [0.14, 220]].forEach(([t, freq]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'triangle'
      o.frequency.setValueAtTime(freq, ctx.currentTime + t)
      g.gain.setValueAtTime(0.2, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.18)
    })
    return 400
  },

  error_stock: (ctx) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'triangle'
    o.frequency.setValueAtTime(280, ctx.currentTime)
    o.frequency.setValueAtTime(210, ctx.currentTime + 0.12)
    g.gain.setValueAtTime(0.18, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.28)
    return 350
  },

  error_permission: (ctx) => {
    [[0, 300], [0.12, 240], [0.24, 180]].forEach(([t, freq]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'square'
      o.frequency.setValueAtTime(freq, ctx.currentTime + t)
      g.gain.setValueAtTime(0.15, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.14)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.14)
    })
    return 500
  },

  error_system: (ctx) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(160, ctx.currentTime)
    g.gain.setValueAtTime(0.15, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.3)
    return 400
  },

  // UI 互動類

  tab_switch: (ctx) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(880, ctx.currentTime)
    g.gain.setValueAtTime(0.08, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.08)
    return 100
  },

  modal_open: (ctx) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(660, ctx.currentTime)
    o.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1)
    g.gain.setValueAtTime(0.1, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.12)
    return 150
  },

  modal_close: (ctx) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.setValueAtTime(660, ctx.currentTime)
    o.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.1)
    g.gain.setValueAtTime(0.08, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.12)
    return 150
  },
}

// ── 主播放函式 ────────────────────────────────────────
export function playSound(key) {
  if (!isSoundEnabled()) return
  const fn = SOUNDS[key]
  if (!fn) return
  const ctx = getCtx()
  if (!ctx) return
  try { fn(ctx) } catch (e) {}
}

// ── 音效開關 React 元件 ───────────────────────────────
export function SoundToggle({ style = {} }) {
  const [enabled, setEnabled] = useState(isSoundEnabled())

  function toggle() {
    const next = !enabled
    setEnabled(next)
    setSoundEnabled(next)
    if (next) {
      // 開啟時播一個確認音
      setTimeout(() => playSound('tab_switch'), 50)
    }
  }

  return (
    <button
      onClick={toggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', width: '100%',
        background: '#fdfaf4', border: '0.5px solid #f0e8d0',
        borderRadius: 10, cursor: 'pointer',
        ...style,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: enabled ? 'linear-gradient(135deg,#FAEEDA,#FFF3D0)' : '#f5f5f5',
        border: `0.5px solid ${enabled ? '#FAC775' : '#e5e5e5'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i
          className={`fa-solid ${enabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}
          style={{ fontSize: 15, color: enabled ? '#BA7517' : '#bbb' }}
        />
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>音效</div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>
          {enabled ? '點擊可關閉音效' : '點擊可開啟音效'}
        </div>
      </div>
      <div style={{
        width: 36, height: 20, borderRadius: 99,
        background: enabled ? '#BA7517' : '#e0e0e0',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: enabled ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
    </button>
  )
}
