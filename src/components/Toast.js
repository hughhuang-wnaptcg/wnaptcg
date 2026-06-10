// src/components/Toast.js
//
// 全站輕量 Toast 通知
// ─────────────────────────────────────────────────────────────
// 用法：
//   1. 在 App.js 最外層包一次 <ToastProvider> ... </ToastProvider>
//   2. 任何元件內：
//        import { useToast } from '../components/Toast'
//        const toast = useToast()
//        toast.success('已儲存')
//        toast.error('兌換失敗：點數不足')
//        toast.info('資料已更新')
//
// 取代原本的 alert(...)：
//   alert('兌換失敗：' + err.message)  →  toast.error('兌換失敗：' + err.message)
//
// 特性：
//   - 底部滑入、3 秒後自動消失（error 顯示 4 秒，稍長以便閱讀）
//   - 暖黃色系 success / 紅色系 error / 中性 info，與全站風格一致
//   - 同時最多堆疊 3 則，舊的自動移除
//   - 零外部依賴，純 React state + 內嵌 CSS
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

const TYPE_CONFIG = {
  success: { icon: 'fa-circle-check',        bg: '#fff', border: '#86C566', iconColor: '#388E3C', barColor: '#86C566', text: '#173404' },
  error:   { icon: 'fa-circle-exclamation',  bg: '#fff', border: '#F09595', iconColor: '#E24B4A', barColor: '#E24B4A', text: '#7A1A1A' },
  info:    { icon: 'fa-circle-info',          bg: '#fff', border: '#FAC775', iconColor: '#E07B00', barColor: '#FAC775', text: '#7A4A00' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((message, type = 'info', duration) => {
    if (!message) return
    const id = ++idRef.current
    const ms = duration != null ? duration : (type === 'error' ? 4000 : 3000)
    setToasts(prev => {
      const next = [...prev, { id, message, type, leaving: false }]
      // 最多同時 3 則，超出移除最舊
      return next.slice(-3)
    })
    // 到時間先觸發離場動畫，再移除
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => remove(id), 260)
    }, ms)
  }, [remove])

  const api = {
    success: (msg, duration) => push(msg, 'success', duration),
    error:   (msg, duration) => push(msg, 'error', duration),
    info:    (msg, duration) => push(msg, 'info', duration),
    show:    (msg, type, duration) => push(msg, type, duration),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <style>{`
        @keyframes wnaToastIn {
          0% { opacity: 0; transform: translateY(16px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wnaToastOut {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(10px) scale(0.98); }
        }
      `}</style>
      <div style={{
        position: 'fixed', left: '50%', bottom: 92, transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390, padding: '0 20px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.info
          return (
            <div key={t.id}
              onClick={() => { setToasts(prev => prev.map(x => x.id === t.id ? { ...x, leaving: true } : x)); setTimeout(() => remove(t.id), 260) }}
              style={{
                width: '100%', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', gap: 10,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderLeft: `4px solid ${cfg.barColor}`,
                borderRadius: 12, padding: '11px 14px',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                pointerEvents: 'auto', cursor: 'pointer',
                animation: t.leaving ? 'wnaToastOut 0.26s ease forwards' : 'wnaToastIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
              <i className={`fa-solid ${cfg.icon}`} style={{ fontSize: 16, color: cfg.iconColor, flexShrink: 0 }}></i>
              <span style={{ fontSize: 13, fontWeight: 500, color: cfg.text, lineHeight: 1.5, flex: 1 }}>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // 後備：若忘了包 Provider，至少不會整頁崩潰，退回 console
    return {
      success: (m) => console.log('[toast.success]', m),
      error:   (m) => console.warn('[toast.error]', m),
      info:    (m) => console.log('[toast.info]', m),
      show:    (m) => console.log('[toast]', m),
    }
  }
  return ctx
}

export default ToastProvider
