import React from 'react'

// Minimal underline tabs - no rounded cards, clean lines
export function AdminTabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  variant = 'underline', // 'underline' | 'bordered'
}) {
  if (!tabs.length) return null

  return (
    <div className={`admin-tabs ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          onClick={() => onChange?.(tab.id)}
          className={`
            admin-tab
            ${activeTab === tab.id ? 'admin-tab-active' : ''}
            ${variant === 'bordered' ? 'admin-tab-bordered' : 'admin-tab-underline'}
            ${tab.disabled ? 'admin-tab-disabled' : ''}
          `}
          disabled={tab.disabled}
        >
          <span className="flex items-center gap-1.5">
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
            {tab.badge && (
              <span className={`admin-badge admin-badge-${tab.badgeColor || 'info'} text-xs px-1.5 py-0.5`}>
                {tab.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

// Tab panel wrapper
export function TabPanel({ children, id, activeTab, className = '' }) {
  if (activeTab !== id) return null
  return (
    <div
      id={`${id}-panel`}
      role="tabpanel"
      aria-labelledby={`${id}-tab`}
      className={`admin-tab-panel animate-in ${className}`}
    >
      {children}
    </div>
  )
}