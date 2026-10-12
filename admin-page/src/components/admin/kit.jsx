import React from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { tokens, radius } from '../../theme'

// Shared building blocks for the newer admin pages (alerts, people, faculty & research, settings).

export function Modal({ title, onClose, size = 'md', children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.6)' }} onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-h-[88vh] overflow-y-auto"
        style={{ background: tokens.surface, borderRadius: radius.container, maxWidth: size === 'xl' ? 720 : size === 'lg' ? 600 : 480, border: `1px solid ${tokens.hairline}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${tokens.hairline}` }}>
          <h2 className="text-base font-semibold" style={{ color: tokens.ink }}>{title}</h2>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center hover:bg-white/[0.04]" style={{ borderRadius: radius.chip, color: tokens.inkSoft }} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className="px-5 py-3.5 flex justify-end gap-2" style={{ borderTop: `1px solid ${tokens.hairline}` }}>{footer}</div> : null}
      </div>
    </div>
  )
}

const control = { background: tokens.sunken, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button, color: tokens.ink }

// A labelled field. The error sits directly under the control it's about.
export function Field({ label, required, error, hint, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium mb-1" style={{ color: tokens.ink }}>
        {label} {required && <span style={{ color: tokens.violet }} aria-hidden>*</span>}
      </label>
      {children}
      {error ? <p role="alert" className="text-xs mt-1" style={{ color: '#f87171' }}>{error}</p> : hint ? <p className="text-xs mt-1" style={{ color: tokens.inkFaint }}>{hint}</p> : null}
    </div>
  )
}

export const TextInput = React.forwardRef(function TextInput({ invalid, ...props }, ref) {
  return <input ref={ref} className="w-full px-3 h-9 text-sm outline-none" style={{ ...control, ...(invalid && { borderColor: '#f87171' }) }} aria-invalid={invalid || undefined} {...props} />
})
export function TextArea({ invalid, ...props }) {
  return <textarea className="w-full px-3 py-2 text-sm outline-none resize-y" style={{ ...control, ...(invalid && { borderColor: '#f87171' }) }} aria-invalid={invalid || undefined} {...props} />
}
export function Select({ children, ...props }) {
  return <select className="w-full px-3 h-9 text-sm outline-none" style={control} {...props}>{children}</select>
}

// Comma-separated list input that stores an array ("Python, Arduino").
export function ListInput({ value, onChange, ...props }) {
  const [text, setText] = React.useState((value ?? []).join(', '))
  return <TextInput value={text} onChange={(e) => { setText(e.target.value); onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean)) }} {...props} />
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, loading, ...rest }) {
  const styles = {
    primary: { background: tokens.violet, color: '#fff', border: `1px solid ${tokens.violet}` },
    secondary: { background: 'transparent', color: tokens.ink, border: `1px solid ${tokens.hairline}` },
    danger: { background: 'transparent', color: '#f87171', border: `1px solid ${tokens.hairline}` },
    dangerSolid: { background: '#b91c1c', color: '#fff', border: '1px solid #b91c1c' },
  }[variant]
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className="px-3 h-9 text-[13px] font-medium inline-flex items-center justify-center gap-2 smooth smooth-press disabled:opacity-50" style={{ ...styles, borderRadius: radius.button }} {...rest}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}{children}
    </button>
  )
}

export function ConfirmDialog({ title, message, confirmText = 'Confirm', danger, loading, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose} footer={(
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'dangerSolid' : 'primary'} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </>
    )}>
      <p className="text-sm leading-relaxed" style={{ color: tokens.inkSoft }}>{message}</p>
    </Modal>
  )
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16" role="status" aria-live="polite" style={{ color: tokens.inkSoft }}>
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden /><span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center" role="alert">
      <AlertTriangle className="w-6 h-6" style={{ color: '#f87171' }} aria-hidden />
      <p className="text-sm max-w-md" style={{ color: tokens.ink }}>{message}</p>
      {onRetry ? <Button variant="secondary" onClick={onRetry}>Try again</Button> : null}
    </div>
  )
}

export function Empty({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      {Icon ? <Icon className="w-7 h-7" style={{ color: tokens.inkFaint }} aria-hidden /> : null}
      <p className="text-sm font-medium" style={{ color: tokens.ink }}>{title}</p>
      {body ? <p className="text-xs max-w-sm" style={{ color: tokens.inkSoft }}>{body}</p> : null}
    </div>
  )
}

// Shown instead of a page when the signed-in admin lacks the permission for it.
export function NoAccess({ what }) {
  return <Empty title="You don't have access to this" body={`Ask a superadmin to give your account permission to manage ${what}.`} />
}

export const th = 'text-left text-[11px] font-semibold uppercase tracking-wide px-4 py-2.5'
export const td = 'px-4 py-3 text-sm align-top'

export function timeAgo(iso) {
  if (!iso) return '—'
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
