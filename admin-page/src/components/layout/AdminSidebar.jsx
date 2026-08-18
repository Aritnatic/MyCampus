import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BookOpen,
  Briefcase,
  Settings,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
} from 'lucide-react'
import { currentAdmin } from '../../data/admin'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/notices-events', label: 'Notices & Events', icon: FileText },
  { path: '/admin/exams-results', label: 'Exams & Results', icon: BookOpen },
  { path: '/admin/placements', label: 'Placements', icon: Briefcase },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
  currentPath = '/',
}) {
  const location = useLocation()
  const activePath = currentPath || location.pathname

  return (
    <>
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-admin-200
          transition-all duration-200 ease-in-out
          ${collapsed ? 'w-18' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Admin sidebar navigation"
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-admin-200">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-admin-900 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-admin-900 truncate">MyCampus</h1>
                <p className="text-xs text-admin-500 truncate">Admin Panel</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 bg-admin-900 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
            </div>
          )}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded hover:bg-admin-100 text-admin-500"
            aria-label="Close sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
          <ul className="space-y-1 px-3" role="list">
            {navItems.map((item) => {
              const isActive = activePath.startsWith(item.path)
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-admin-600 hover:bg-admin-100 hover:text-admin-900'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={onCloseMobile}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>

          {/* Collapse Toggle */}
          {!mobileOpen && (
            <div className="pt-4 border-t border-admin-200 px-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                className={`w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-admin-600 hover:bg-admin-100 hover:text-admin-900 transition-colors ${
                  collapsed ? 'justify-center' : ''
                }`}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <>
                    <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            </div>
          )}
        </nav>

        {/* Footer - User Info */}
        {!collapsed && (
          <div className="p-4 border-t border-admin-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-admin-900 truncate">{currentAdmin.name}</p>
                <p className="text-xs text-admin-500 truncate">{currentAdmin.university.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="admin-btn-ghost p-1.5 flex-1" title="Settings">
                <Settings className="w-4 h-4" />
              </button>
              <button className="admin-btn-ghost p-1.5 flex-1 text-danger-600 hover:bg-danger-50" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-admin-200 bg-white">
            <button
              onClick={onCloseMobile}
              className="admin-btn-ghost w-full justify-center"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-danger-600" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Toggle Button (hidden on lg) */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        className="fixed bottom-4 left-4 z-40 lg:hidden admin-btn-primary rounded-full p-3 shadow-lg"
        aria-label="Open navigation menu"
      >
        <LayoutDashboard className="w-6 h-6" />
      </button>
    </>
  )
}