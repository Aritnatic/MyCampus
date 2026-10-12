import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { tokens, radius } from '../../theme'

export function AdminPageLayout({
  title,
  subtitle,
  children,
  breadcrumbs = [],
  actions = [],
  className = '',
}) {
  return (
    <div className={className}>
      {/* Page Header — token-based, matches the rest of the admin */}
      <header
        className="flex items-center justify-between gap-4 px-6 lg:px-8 h-16"
        style={{ borderBottom: `1px solid ${tokens.hairline}`, background: tokens.surface }}
      >
        <div className="min-w-0">
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-[11px] mb-0.5" style={{ color: tokens.inkFaint }} aria-label="Breadcrumb">
              <Link to="/admin" className="hover:opacity-80" style={{ color: tokens.inkSoft }}>Admin</Link>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path || i} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  {crumb.path ? (
                    <Link to={crumb.path} className="hover:opacity-80" style={{ color: tokens.inkSoft }}>{crumb.label}</Link>
                  ) : (
                    <span style={{ color: tokens.ink }}>{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: tokens.ink }}>{title}</h1>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: tokens.inkSoft }}>{subtitle}</p>}
        </div>
        {actions.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions.map((action, i) => (
              <React.Fragment key={action.label || i}>
                {action.component || (
                  <button
                    onClick={action.onClick}
                    className="admin-btn flex items-center gap-1.5"
                    style={{
                      background: action.variant === 'secondary' ? tokens.surface : tokens.accent,
                      color: action.variant === 'secondary' ? tokens.ink : '#fff',
                      border: action.variant === 'secondary' ? `1px solid ${tokens.hairline}` : 'none',
                      borderRadius: radius.button,
                      padding: '0 14px',
                      height: 36,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                    disabled={action.disabled}
                  >
                    {action.icon && <span className="w-3.5 h-3.5">{action.icon}</span>}
                    {action.label}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6 max-w-7xl">
        {children}
      </div>
    </div>
  )
}

export function AdminPageSection({ title, description, children, className = '', action }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            {title && <h2 className="text-base font-semibold" style={{ color: tokens.ink }}>{title}</h2>}
            {description && <p className="text-xs mt-0.5" style={{ color: tokens.inkSoft }}>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
