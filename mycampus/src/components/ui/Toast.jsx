import React, { useState, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = 'default', duration = 5000 }) => {
    const id = Date.now().toString()
    const newToast = { id, title, description, variant, duration }
    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }

  const dismiss = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const variants = {
    default: { icon: Info, color: 'bg-primary-50 text-primary-700 border-primary-200', iconColor: 'text-primary-600' },
    success: { icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200', iconColor: 'text-green-600' },
    error: { icon: AlertCircle, color: 'bg-red-50 text-red-700 border-red-200', iconColor: 'text-red-600' },
    warning: { icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200', iconColor: 'text-amber-600' },
  }

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} variants={variants} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

const ToastContainer = ({ toasts, onDismiss, variants }) => {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => {
        const v = variants[t.variant] || variants.default
        const Icon = v.icon
        return (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg
              min-w-[300px] max-w-md animate-slide-up
              ${v.color}
            `}
            role="alert"
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${v.iconColor}`} />
            <div className="flex-1">
              {t.title && <p className="font-medium">{t.title}</p>}
              {t.description && <p className="text-sm opacity-90 mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 opacity-60" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}

// Simple toast component for inline use
export const Toast = ({ title, description, variant = 'default', onClose, className = '' }) => {
  const variants = {
    default: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${variants[variant]} ${className}`} role="alert">
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {description && <p className="text-sm opacity-90 mt-0.5">{description}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors" aria-label="Dismiss">
          <X className="w-4 h-4 opacity-60" />
        </button>
      )}
    </div>
  )
}