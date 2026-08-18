import React from 'react'
import { motion } from 'framer-motion'

// Minimal tab component for admin pages - underline style, no cards
const AdminTabs = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex gap-1" role="tablist" aria-label="Admin sections">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            aria-controls={`panel-${tab.value}`}
            id={`tab-${tab.value}`}
            onClick={() => onChange(tab.value)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium
              border-b-2 transition-all duration-200
              ${activeTab === tab.value
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

const AdminTabsContent = ({ activeTab, tabs, children, className = '' }) => {
  return (
    <div className={className} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
      {children}
    </div>
  )
}

export { AdminTabs, AdminTabsContent }