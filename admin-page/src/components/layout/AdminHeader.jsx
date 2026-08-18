import React, { useState, useRef, useEffect } from 'react'
import { Menu, Bell, Search, User, LogOut, Settings, Shield, ChevronDown, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { currentAdmin } from '../../data/admin'

export function AdminHeader({
  onMenuClick,
  sidebarCollapsed,
  onToggleSidebar,
  admin,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const notificationsRef = useRef(null)
  const userMenuRef = useRef(null)

  const notifications = [
    { id: 1, type: 'event', title: 'TechFest 2024 approved', time: '2 hours ago', read: false },
    { id: 2, type: 'exam', title: 'CSE 3rd Sem exams scheduled', time: '5 hours ago', read: false },
    { id: 3, type: 'job', title: 'TCS Internship posted', time: '1 day ago', read: true },
    { id: 4, type: 'result', title: 'ECE 5th Sem results published', time: '2 days ago', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-admin-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-4">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden admin-btn-ghost p-2"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex admin-btn-ghost p-2"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>

          {/* Search */}
          <div className="hidden md:block relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
            <input
              type="text"
              placeholder="Search notices, events, exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input pl-10 w-full"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative admin-btn-ghost p-2"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={notificationsOpen}
            >
              <Bell className="w-5 h-5 text-admin-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-admin-200 rounded shadow-lg animate-in z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-admin-200">
                  <h3 className="font-semibold text-admin-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button className="text-sm text-primary-600 hover:underline">Mark all read</button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      className={`w-full px-4 py-3 text-left border-b border-admin-100 hover:bg-admin-50 transition-colors ${!notif.read ? 'bg-primary-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                          notif.type === 'event' ? 'bg-primary-500' :
                          notif.type === 'exam' ? 'bg-danger-500' :
                          notif.type === 'job' ? 'bg-success-500' : 'bg-warning-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notif.read ? 'font-medium text-admin-900' : 'text-admin-700'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-admin-500 mt-0.5">{notif.time}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-admin-200">
                  <button className="admin-btn-ghost w-full text-sm">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 admin-btn-ghost p-1.5 rounded-lg"
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-admin-900">
                {admin?.name || 'Admin'}
              </span>
              <ChevronDown className="w-4 h-4 text-admin-500 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-admin-200 rounded shadow-lg animate-in z-50">
                <div className="px-4 py-3 border-b border-admin-200">
                  <p className="font-medium text-admin-900">{admin?.name}</p>
                  <p className="text-sm text-admin-500">{admin?.email}</p>
                  <p className="text-xs text-admin-400 mt-1">{admin?.university.toUpperCase()} • {admin?.role}</p>
                </div>
                <nav className="py-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-admin-700 hover:bg-admin-50">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-admin-700 hover:bg-admin-50">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-admin-700 hover:bg-admin-50">
                    <Shield className="w-4 h-4" />
                    Security
                  </button>
                  <hr className="my-2 border-admin-100" />
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}