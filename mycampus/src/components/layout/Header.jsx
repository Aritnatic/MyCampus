import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Search, Bell, Menu, Sun, Moon, User, LogOut, Settings, Shield, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, Badge, Dropdown, DropdownMenu, DropdownItem, DropdownDivider, DropdownLabel } from '../ui'
import { SearchInput } from '../ui/Input'
import { currentUser } from '../../data'
import { useTheme } from '../../context/ThemeContext'

const Header = ({ onMenuClick, sidebarCollapsed }) => {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  const mockNotifications = [
    { id: 1, title: 'SIH 2024 Registration Open', message: 'Internal round registrations close Feb 5', time: '2h ago', unread: true },
    { id: 2, title: 'New Research Opportunity', message: 'Federated Learning for Healthcare - IIT Bhubaneswar', time: '5h ago', unread: true },
    { id: 3, title: 'Exam Timetable Published', message: 'CSE 5th Sem End Sem exams Feb 12-26', time: '1d ago', unread: false },
    { id: 4, title: 'Project Match: CampusNav', message: 'Looking for iOS developer - you match!', time: '2d ago', unread: false },
  ]

  const unreadCount = mockNotifications.filter(n => n.unread).length

  const { theme, toggleTheme } = useTheme()

  return (
    <header
      className={`
        fixed top-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800
        flex items-center justify-between px-4 sm:px-6 z-30
        ${sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'}
      `}
      style={{ left: sidebarCollapsed ? 72 : 260 }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Search */}
      <div className="hidden lg:flex flex-1 max-w-md mx-6">
        <SearchInput
          placeholder="Search people, projects, events, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <Dropdown
          trigger={
            <button
              className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          }
        >
          <DropdownMenu className="w-80">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">Mark all read</button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {mockNotifications.map((n) => (
                <DropdownItem
                  key={n.id}
                  className={`px-4 py-3 ${n.unread ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}
                  onClick={() => {}}
                >
                  <div className="flex-1">
                    <p className={`font-medium ${n.unread ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{n.time}</p>
                  </div>
                  {n.unread && <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2" />}
                </DropdownItem>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center">
              <NavLink to="/notifications" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                View all notifications
              </NavLink>
            </div>
          </DropdownMenu>
        </Dropdown>

        {/* User menu */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Avatar name={currentUser.name} size="sm" status="online" />
              <span className="hidden md:block font-medium text-gray-700 dark:text-gray-300">{currentUser.name.split(' ')[0]}</span>
            </button>
          }
        >
          <DropdownMenu className="w-48">
            <DropdownLabel>Account</DropdownLabel>
            <DropdownItem icon={<User className="w-4 h-4" />}>Profile</DropdownItem>
            <DropdownItem icon={<Settings className="w-4 h-4" />}>Settings</DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<Shield className="w-4 h-4" />}>Verification Status</DropdownItem>
            <DropdownItem icon={<Globe className="w-4 h-4" />}>Cross-University Access</DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<LogOut className="w-4 h-4" />} danger>Logout</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </header>
  )
}

export default Header