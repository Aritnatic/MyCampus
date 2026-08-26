import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function AdminStatBar({ stats = [], className = '' }) {
  if (!stats.length) return null

  return (
    <div className={`admin-stat-bar grid grid-cols-2 lg:grid-cols-{stats.length > 4 ? '5' : stats.length} gap-4 mb-6 ${className}`}>
      {stats.map((stat, i) => (
        <div key={stat.key || i} className="admin-stat-card bg-white border border-admin-100 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-admin-500">{stat.label}</p>
              <p className="text-2xl font-bold text-admin-900 mt-1">
                {typeof stat.value === 'function' ? stat.value() : stat.value}
              </p>
              {stat.trend !== undefined && (
                <p className="text-sm mt-1 flex items-center gap-1">
                  {stat.trend > 0 ? (
                    <span className="text-success-600 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      +{stat.trend}%
                    </span>
                  ) : stat.trend < 0 ? (
                    <span className="text-danger-600 flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {stat.trend}%
                    </span>
                  ) : (
                    <span className="text-admin-400 flex items-center gap-0.5">
                      <Minus className="w-3 h-3" />
                      No change
                    </span>
                  )}
                </p>
              )}
              {stat.description && <p className="text-xs text-admin-400 mt-1">{stat.description}</p>}
            </div>
            {stat.icon && (
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg || 'bg-primary-100'}`}>
                {React.cloneElement(stat.icon, { className: 'w-5 h-5 ' + (stat.iconColor || 'text-primary-600') })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper to create stat configs
export function createStat(key, label, value, options = {}) {
  return { key, label, value, ...options }
}