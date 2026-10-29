import React from 'react'
import { tokens, radius } from '../../theme'

// Shared page header — sits on the dark canvas, transparent background, hairline bottom.
// Left: title + subtitle. Right: action slot for the page's primary CTA.
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 lg:px-8 h-16">
      <div className="min-w-0">
        {breadcrumb && (
          <div className="text-[11px] mb-0.5" style={{ color: tokens.inkFaint }}>
            {breadcrumb}
          </div>
        )}
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: tokens.ink }}>{title}</h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: tokens.inkSoft }}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

// Small status pill — dark-mode: 1px-border pill with low-alpha wash + saturated text.
const PILL_STYLES = {
  draft:    { bg: tokens.yellowSoft, border: tokens.yellow, text: tokens.yellowText },
  pending:  { bg: tokens.yellowSoft, border: tokens.yellow, text: tokens.yellowText },
  approved: { bg: tokens.greenSoft,  border: tokens.green,  text: tokens.greenText },
  published:{ bg: tokens.greenSoft,  border: tokens.green,  text: tokens.greenText },
  open:     { bg: tokens.greenSoft,  border: tokens.green,  text: tokens.greenText },
  closed:   { bg: tokens.sunken,     border: tokens.hairline, text: tokens.inkSoft },
  rejected: { bg: tokens.violetSoft, border: tokens.violet, text: tokens.violetText },
  urgent:   { bg: tokens.violetSoft, border: tokens.violet, text: tokens.violetText },
  info:     { bg: tokens.blueSoft,   border: tokens.blue,   text: tokens.blueText },
  warning:  { bg: tokens.yellowSoft, border: tokens.yellow, text: tokens.yellowText },
  danger:   { bg: tokens.redSoft, border: tokens.red, text: tokens.red },
  default:  { bg: tokens.sunken,     border: tokens.hairline, text: tokens.inkSoft },
}

export function StatusPill({ kind, children }) {
  const style = PILL_STYLES[kind] || PILL_STYLES.default
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        borderRadius: radius.chip,
      }}
    >
      {children || kind}
    </span>
  )
}

// Small tag chip — 1px-border rounded rectangle, dark surface, faint border.
export function TagChip({ children, color = tokens.inkSoft, border = tokens.hairline, bg = tokens.surface }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: radius.chip }}
    >
      {children}
    </span>
  )
}

// Primary CTA — orange, 10px radius, 36px tall.
export function PrimaryButton({ children, onClick, icon: Icon, type = 'button', disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3.5 h-9 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
      style={{ background: tokens.accent, color: tokens.accentInk, borderRadius: radius.button }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  )
}

// Secondary (outline) button — dark surface, hairline border, ink text.
export function SecondaryButton({ children, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium transition-colors hover:bg-white/5"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        color: tokens.ink,
        borderRadius: radius.button,
      }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  )
}

// Quiet text-button.
export function TextButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
      style={{ color: tokens.inkSoft }}
    >
      {children}
    </button>
  )
}

// Section card — 14px radius, dark surface, 1px hairline, no shadow.
// (Reference: elevation = bg color step, not shadow.)
// Forwards arbitrary props (onMouseEnter, onMouseLeave, onClick, etc.) to the
// inner div so callers can attach interaction handlers without an extra wrapper.
export function SectionCard({ children, padded = true, className = '', style, ...rest }) {
  return (
    <div
      {...rest}
      className={className}
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: radius.container,
        padding: padded ? 20 : 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
