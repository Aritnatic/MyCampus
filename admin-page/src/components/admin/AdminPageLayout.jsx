import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Menu } from 'lucide-react'

export function AdminPageLayout({
  title,
  subtitle,
  children,
  breadcrumbs = [],
  actions = [],
  className = '',
}) {
  const location = useLocation()

  return (
    <div className={`admin-page ${className}`}>
      {/* Sticky Header */}
      <header className="admin-page-header sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-admin-100 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="mb-3 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
              <Link to="/admin" className="text-admin-400 hover:text-admin-600 flex items-center gap-1.5">
                <Menu className="w-4 h-4" />
                Admin
              </Link>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path || i} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-admin-300" />
                  {crumb.path ? (
                    <Link to={crumb.path} className="text-admin-400 hover:text-admin-600">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-admin-900 font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Title & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-admin-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-admin-500 mt-1">{subtitle}</p>}
            </div>
            {actions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {actions.map((action, i) => (
                  <React.Fragment key={action.label || i}>
                    {action.component || (
                      <button
                        onClick={action.onClick}
                        className={`admin-btn-${action.variant || 'primary'} ${action.size ? `admin-btn-${action.size}` : ''} flex items-center gap-2`}
                        disabled={action.disabled}
                      >
                        {action.icon && <span className="w-4 h-4">{action.icon}</span>}
                        {action.label}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}

export function AdminPageSection({ title, description, children, className = '', action }) {
  return (
    <section className={`admin-section ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-admin-900">{title}</h2>}
            {description && <p className="text-sm text-admin-500 mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}