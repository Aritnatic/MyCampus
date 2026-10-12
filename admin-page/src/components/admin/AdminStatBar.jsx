import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { tokens, radius } from '../../theme'

export function AdminStatBar({ stats = [], className = '' }) {
  if (!stats.length) return null

  const cols = stats.length > 4 ? 5 : stats.length
  const gridClass = `grid-cols-${cols}`

  return (
    <div className={`grid gap-3 mb-6 ${gridClass} grid-cols-2 lg:${gridClass} ${className}`}>
      {stats.map((stat, i) => {
        const accent = stat.color || 'green'
        const colorMap = {
          green:  { bg: tokens.greenSoft,  fg: tokens.green,  text: tokens.greenText },
          orange: { bg: tokens.violetSoft, fg: tokens.violet, text: tokens.violetText },
          yellow: { bg: tokens.yellowSoft, fg: tokens.yellow, text: tokens.yellowText },
          blue:   { bg: tokens.blueSoft,   fg: tokens.blue,   text: tokens.blueText },
        }[accent] || { bg: tokens.greenSoft, fg: tokens.green, text: tokens.greenText }
        return (
          <div
            key={stat.key || i}
            className="overflow-hidden"
            style={{
              background: tokens.surface,
              border: `1px solid ${tokens.hairline}`,
              borderRadius: radius.container,
            }}
          >
            <div
              className="h-1"
              style={{ background: colorMap.fg }}
            />
            <div className="p-4 flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium" style={{ color: tokens.inkSoft }}>{stat.label}</p>
                <p className="text-2xl font-semibold tracking-tight mt-1" style={{ color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {typeof stat.value === 'function' ? stat.value() : stat.value}
                </p>
                {stat.trend !== undefined && (
                  <p className="text-xs mt-1 flex items-center gap-1">
                    {stat.trend > 0 ? (
                      <span className="flex items-center gap-0.5" style={{ color: tokens.green }}>
                        <TrendingUp className="w-3 h-3" />+{stat.trend}%
                      </span>
                    ) : stat.trend < 0 ? (
                      <span className="flex items-center gap-0.5" style={{ color: tokens.violet }}>
                        <TrendingDown className="w-3 h-3" />{stat.trend}%
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5" style={{ color: tokens.inkFaint }}>
                        <Minus className="w-3 h-3" />No change
                      </span>
                    )}
                  </p>
                )}
                {stat.description && <p className="text-[10px] mt-0.5" style={{ color: tokens.inkFaint }}>{stat.description}</p>}
              </div>
              {stat.icon && (
                <div
                  className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                  style={{ background: colorMap.bg, color: colorMap.fg, borderRadius: radius.chip }}
                >
                  {typeof stat.icon === 'function' ? stat.icon() : stat.icon}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Helper to create stat configs
export function createStat(key, label, value, options = {}) {
  return { key, label, value, ...options }
}
