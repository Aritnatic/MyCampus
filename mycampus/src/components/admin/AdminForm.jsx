import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

// Minimal modal form for admin pages
const AdminModal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full ${sizes[size]} bg-white border border-gray-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {children}
          </div>

          {/* Footer - optional, children can include their own */}
        </motion.div>
      </div>
    </motion.div>
  )
}

// Form field components
const AdminInput = ({ label, error, hint, required, className = '', ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      className={`
        w-full px-3 py-2 rounded border
        bg-white text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900
        disabled:bg-gray-50 disabled:text-gray-500
        ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        transition-colors
      `}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
      {...props}
    />
    {error && (
      <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600" role="alert">
        {error}
      </p>
    )}
    {hint && !error && (
      <p id={`${props.id}-hint`} className="mt-1 text-sm text-gray-500">
        {hint}
      </p>
    )}
  </div>
)

const AdminTextarea = ({ label, error, hint, required, className = '', ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <textarea
      className={`
        w-full px-3 py-2 rounded border resize-none
        bg-white text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900
        disabled:bg-gray-50 disabled:text-gray-500
        ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        transition-colors
      `}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
      {...props}
    />
    {error && (
      <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600" role="alert">
        {error}
      </p>
    )}
    {hint && !error && (
      <p id={`${props.id}-hint`} className="mt-1 text-sm text-gray-500">
        {hint}
      </p>
    )}
  </div>
)

const AdminSelect = ({ label, error, hint, required, options, className = '', ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      className={`
        w-full px-3 py-2 rounded border appearance-none
        bg-white text-gray-900
        focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900
        disabled:bg-gray-50 disabled:text-gray-500
        ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        transition-colors
      `}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && (
      <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600" role="alert">
        {error}
      </p>
    )}
    {hint && !error && (
      <p id={`${props.id}-hint`} className="mt-1 text-sm text-gray-500">
        {hint}
      </p>
    )}
  </div>
)

// Button variants
const AdminButton = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded
        focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

export { AdminModal, AdminInput, AdminTextarea, AdminSelect, AdminButton }