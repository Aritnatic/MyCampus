import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { tokens, radius } from '../../theme'

// Lightweight toast system. One viewport lives near the app root; any
// component can call toast.{info|success|warning|error} and it renders.

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info,
}

const TINTS = {
  success: { bg: tokens.greenSoft,  fg: tokens.greenText,  border: tokens.green  },
  warning: { bg: tokens.violetSoft, fg: tokens.violetText, border: tokens.violet },
  error:   { bg: tokens.violetSoft, fg: tokens.violetText, border: tokens.violet },
  info:    { bg: tokens.blueSoft,   fg: tokens.blueText,   border: tokens.blue   },
}

let _id = 0

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((toast) => {
    const id = ++_id
    const t = { id, kind: 'info', duration: 3200, ...toast }
    setItems((prev) => [...prev, t])
    if (t.duration > 0) {
      setTimeout(() => dismiss(id), t.duration)
    }
    return id
  }, [dismiss])

  const api = useMemo(() => ({
    info:    (message, opts = {}) => push({ kind: 'info',    message, ...opts }),
    success: (message, opts = {}) => push({ kind: 'success', message, ...opts }),
    warning: (message, opts = {}) => push({ kind: 'warning', message, ...opts }),
    error:   (message, opts = {}) => push({ kind: 'error',   message, ...opts }),
    dismiss,
  }), [push, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback so it never crashes if used outside the provider
    return {
      info:    (m) => console.info('[toast]', m),
      success: (m) => console.info('[toast]', m),
      warning: (m) => console.warn('[toast]', m),
      error:   (m) => console.error('[toast]', m),
      dismiss: () => {},
    }
  }
  return ctx
}

function ToastViewport({ items, onDismiss }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 360 }}
    >
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  const Icon = ICONS[toast.kind] || Info
  const tint = TINTS[toast.kind] || TINTS.info
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div
      className="pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 text-[13px] shadow-lg"
      style={{
        background: tokens.surface,
        border: `1px solid ${tint.border}`,
        borderRadius: radius.container,
        color: tokens.ink,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      role="status"
    >
      <span
        className="w-6 h-6 flex items-center justify-center flex-shrink-0"
        style={{ background: tint.bg, color: tint.fg, borderRadius: radius.chip }}
        aria-hidden="true"
      >
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="text-[12px] font-semibold" style={{ color: tokens.ink }}>{toast.title}</div>
        )}
        <div className={toast.title ? 'mt-0.5' : ''} style={{ color: tokens.inkSoft }}>{toast.message}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="w-5 h-5 flex items-center justify-center flex-shrink-0 hover:bg-white/5"
        style={{ color: tokens.inkFaint, borderRadius: radius.chip }}
        aria-label="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
