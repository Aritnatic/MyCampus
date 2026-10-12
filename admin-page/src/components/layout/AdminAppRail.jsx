import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useToast } from '../feedback/Toast'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Briefcase,
  Settings,
  LogOut,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Search,
  ChevronsUpDown,
  Inbox,
  CalendarCheck,
  CheckSquare,
  GraduationCap,
  Bell,
  ShieldAlert,
  FlaskConical,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { tokens, radius } from '../../theme'

// Primary nav — grouped. Reference pattern: recognizable icon + short title,
// grouped by what's relevant, active state = pill on sunken surface.
const PRIMARY = [
  { path: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/students',        icon: Users,           label: 'Students',   anyOf: ['users'] },
  { path: '/admin/notices-events', icon: FileText,        label: 'Notices',    anyOf: ['notices', 'events'] },
  { path: '/admin/exams-results',  icon: BookOpen,        label: 'Exams',      anyOf: ['exams', 'results'] },
  { path: '/admin/placements',     icon: Briefcase,       label: 'Placements', anyOf: ['placements'] },
  { path: '/admin/faculty-research', icon: FlaskConical,   label: 'Faculty & research', anyOf: ['faculty', 'research'] },
  { path: '/admin/alerts',          icon: ShieldAlert,     label: 'Safety alerts',     anyOf: ['safety'] },
  { path: '/admin/feedback',        icon: MessageSquare, label: 'Feedback' },
]

// Secondary nav — workflow shortcuts (reference: "RECENT" sub-section).
const SHORTCUTS = [
  { icon: Inbox,         label: 'Inbox',   path: '/admin/dashboard',             count: 0 },
  { icon: CalendarCheck, label: 'Calendar', path: '/admin/notices-events?tab=events' },
  { icon: CheckSquare,   label: 'Tasks',    path: '/admin/notices-events?tab=notices&status=draft' },
  { icon: GraduationCap, label: 'Results',  path: '/admin/exams-results?tab=results' },
]

// Footer nav (rare use)
const FOOTER = [
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
]

export function AdminAppRail() {
  const { admin, logout, hasPermission } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const initial = (admin?.name || 'A').charAt(0).toUpperCase()
  // Reference widths: 240px expanded, 64px collapsed.
  const width = collapsed ? 'w-[64px]' : 'w-[240px]'

  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 ${width} transition-[width] duration-200`}
      style={{ background: tokens.sunken, borderRight: `1px solid ${tokens.hairline}` }}
      aria-label="Main navigation"
    >
      {/* Workspace switcher (per user: no wordmark / no logo above it) */}
      <div className="px-3 pt-4 pb-3">
        {!collapsed ? (
          <>
            <button
              type="button"
              onClick={() => navigate('/admin/settings?tab=profile')}
              className="smooth smooth-press smooth-press w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-white/5"
              style={{ borderRadius: radius.button }}
              title="Open profile"
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ background: tokens.accent, color: tokens.accentInk }}
              >
                {initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] truncate" style={{ color: tokens.ink }}>
                  {admin?.name || 'Admin'}
                </span>
                <span className="block text-[10px] truncate" style={{ color: tokens.inkFaint }}>
                  {admin?.university?.toUpperCase() || 'CVRP'}
                </span>
              </span>
              <ChevronsUpDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tokens.inkFaint }} />
            </button>
          </>
        ) : (
          <div className="flex justify-center">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: tokens.accent, color: tokens.accentInk }}
            >
              {initial}
            </span>
          </div>
        )}
      </div>

      {/* Search (collapsed: shows as icon only) */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div
            className="flex items-center gap-2 px-2.5 h-8"
            style={{ background: tokens.canvas, border: `1px solid ${tokens.hairline}`, borderRadius: radius.button }}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tokens.inkFaint }} />
            <input
              type="text"
              placeholder="Search"
              className="flex-1 min-w-0 bg-transparent text-[12px] outline-none"
              style={{ color: tokens.ink }}
            />
            <kbd
              className="text-[10px] px-1.5 py-0.5"
              style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, color: tokens.inkFaint, borderRadius: 4 }}
            >
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* Primary nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto" aria-label="Primary">
        {!collapsed && (
          <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: tokens.inkFaint }}>
            Workspace
          </div>
        )}
        {PRIMARY.filter((item) => !item.anyOf || item.anyOf.some(hasPermission)).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 my-0.5 text-[13px] smooth smooth-press ${
                  isActive
                    ? 'text-white font-medium'
                    : 'hover:bg-white/5'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? tokens.ink : tokens.inkSoft,
                background: isActive ? tokens.hover : 'transparent',
                borderRadius: radius.button,
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? tokens.accent : tokens.inkFaint }}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          )
        })}

        {!collapsed && (
          <div className="px-2.5 py-1.5 mt-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: tokens.inkFaint }}>
            Shortcuts
          </div>
        )}
        {SHORTCUTS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 my-0.5 text-[13px] smooth smooth-press hover:bg-white/5"
              style={{ color: tokens.inkSoft, borderRadius: radius.button }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: tokens.inkFaint }} aria-hidden="true" />
              {!collapsed && (
                <>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.count > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5"
                      style={{ background: tokens.violetSoft, color: tokens.violetText, borderRadius: radius.chip }}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer: settings, help, logout, collapse */}
      <div className="px-2 py-2" style={{ borderTop: `1px solid ${tokens.hairline}` }}>
        {!collapsed && (
          <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: tokens.inkFaint }}>
            System
          </div>
        )}
        {FOOTER.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 my-0.5 text-[13px] smooth smooth-press ${
                  isActive ? 'font-medium' : 'hover:bg-white/5'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? tokens.ink : tokens.inkSoft,
                background: isActive ? tokens.hover : 'transparent',
                borderRadius: radius.button,
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? tokens.accent : tokens.inkFaint }}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={() => toast.info('Help center coming soon. Reach the team at admin@mycampus.app.', { title: 'Help' })}
          title="Help"
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 my-0.5 text-[13px] smooth smooth-press hover:bg-white/5"
          style={{ color: tokens.inkSoft, borderRadius: radius.button }}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" style={{ color: tokens.inkFaint }} />
          {!collapsed && <span>Help</span>}
        </button>
        <button
          type="button"
          onClick={logout}
          title="Sign out"
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 my-0.5 text-[13px] smooth smooth-press hover:bg-white/5"
          style={{ color: tokens.inkSoft, borderRadius: radius.button }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: tokens.inkFaint }} />
          {!collapsed && <span>Log out</span>}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 my-0.5 text-[12px] smooth smooth-press hover:bg-white/5"
          style={{ color: tokens.inkFaint, borderRadius: radius.button }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
            : (
              <>
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                <span>Collapse</span>
              </>
            )}
        </button>
      </div>
    </aside>
  )
}

export default AdminAppRail
