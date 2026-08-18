import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  Users,
  GraduationCap,
  Calendar,
  Briefcase,
  FlaskConical,
  FolderKanban,
  Rocket,
  FileText,
  Clock,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Globe,
  Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, Badge } from '../ui'

const navigation = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', badge: null },
  { key: 'map', label: 'Campus Map', icon: Map, path: '/map', badge: null },
  { key: 'students', label: 'Discover People', icon: Users, path: '/students', badge: 'New' },
  { key: 'faculty', label: 'Faculty Directory', icon: GraduationCap, path: '/faculty', badge: null },
  { key: 'events', label: 'Events & Hackathons', icon: Calendar, path: '/events', badge: '3' },
  { key: 'jobs', label: 'Careers', icon: Briefcase, path: '/jobs', badge: '8' },
  { key: 'research', label: 'Research', icon: FlaskConical, path: '/research', badge: '6' },
  { key: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects', badge: '6' },
  { key: 'startups', label: 'Startups', icon: Rocket, path: '/startups', badge: '5' },
  { key: 'notes', label: 'Study Notes', icon: FileText, path: '/notes', badge: '8' },
  { key: 'timetable', label: 'Exams & Timetable', icon: Clock, path: '/timetable', badge: null },
]

const adminNavigation = [
  { key: 'admin', label: 'Admin Dashboard', icon: Shield, path: '/admin', badge: null },
  { key: 'admin-notices', label: 'Notices & Events', icon: FileText, path: '/admin/notices-events', badge: null },
  { key: 'admin-exams', label: 'Exams & Results', icon: Clock, path: '/admin/exams-results', badge: null },
  { key: 'admin-placements', label: 'Placements', icon: Briefcase, path: '/admin/placements', badge: null },
  { key: 'admin-settings', label: 'Settings', icon: Settings, path: '/admin/settings', badge: null },
]

const bottomNav = [
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { key: 'logout', label: 'Logout', icon: LogOut, path: '/logout' },
]

const Sidebar = ({ collapsed, onToggleCollapse, user }) => {
  const location = useLocation()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`
        fixed left-0 top-0 h-screen bg-white border-r border-gray-100 dark:bg-gray-900 dark:border-gray-800
        flex flex-col z-40
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
      style={{ width: collapsed ? 72 : 260 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
          transition={{ duration: 0.15 }}
          style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-gray-100">MyCampus</span>
          </NavLink>
        </motion.div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          const Icon = item.icon

          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive: active }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200
                ${active
                  ? 'bg-primary-50 text-primary-600 shadow-sm dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'}
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !collapsed && (
                <Badge variant="primary" size="sm">{item.badge}</Badge>
              )}
            </NavLink>
          )
        })}

        {/* Admin Navigation (conditional) */}
        {user?.isAdmin && (
          <>
            <div className="mx-0 my-2 border-t border-gray-100 dark:border-gray-800" />
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {collapsed ? 'A' : 'Admin Panel'}
            </p>
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
              const Icon = item.icon

              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive: active }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200
                    ${active
                      ? 'bg-gray-900 text-white shadow-sm dark:bg-gray-100 dark:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'}
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="font-medium truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.badge && !collapsed && (
                    <Badge variant="primary" size="sm">{item.badge}</Badge>
                  )}
                </NavLink>
              )
            })}
          </>
        )}
      </nav>

      {/* Divider */}
      {!collapsed && <div className="mx-3 border-t border-gray-100 dark:border-gray-800 my-2" />}

      {/* User profile / quick actions */}
      <div className="p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <Avatar name={user?.name} size="md" status="online" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} size="md" status="online" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate dark:text-gray-400">{user?.branch} · Year {user?.year}</p>
            </div>
            <Badge variant="success" size="sm" dot>Verified</Badge>
          </div>
        )}

        {!collapsed && (
          <div className="mt-4 space-y-1">
            <NavLink
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </NavLink>
            <NavLink
              to="/notifications"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors relative dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">Notifications</span>
              <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
            </NavLink>
          </div>
        )}
      </div>

      {/* Version badge */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>MyCampus v0.1.0</span>
            <Badge variant="gray" size="sm">Prototype</Badge>
          </div>
        </div>
      )}
    </motion.aside>
  )
}

export default Sidebar