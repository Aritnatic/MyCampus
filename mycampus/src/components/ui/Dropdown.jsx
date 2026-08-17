import React, { useRef, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

const Dropdown = ({ children, trigger, className = '' }) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setOpen(!open)} className="flex items-center gap-1">
        {trigger}
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] animate-slide-down">
          {children}
        </div>
      )}
    </div>
  )
}

const DropdownMenu = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-white rounded-xl border border-gray-200 shadow-lg p-1
      ${className}
    `}
    role="menu"
    {...props}
  >
    {children}
  </div>
)

const DropdownItem = ({ children, onClick, disabled = false, danger = false, icon, className = '', ...props }) => (
  <button
    role="menuitem"
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); if (!disabled) onClick?.(e) }}
    className={`
      w-full px-4 py-2.5 rounded-lg text-sm flex items-center gap-3
      transition-colors
      ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `}
    {...props}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    <span className="flex-1 text-left">{children}</span>
  </button>
)

const DropdownDivider = ({ className = '' }) => (
  <hr className={`border-gray-100 my-1 ${className}`} role="separator" />
)

const DropdownLabel = ({ children, className = '' }) => (
  <p className={`px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide ${className}`}>
    {children}
  </p>
)

export { Dropdown, DropdownMenu, DropdownItem, DropdownDivider, DropdownLabel }