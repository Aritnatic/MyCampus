import React, { forwardRef } from 'react'

// Modal component - minimal, flat, no shadows
export function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showClose = true,
}) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'w-full max-w-md',
    md: 'w-full max-w-lg',
    lg: 'w-full max-w-2xl',
    xl: 'w-full max-w-4xl',
    full: 'w-full max-w-[90vw]',
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose?.()
  }

  return (
    <div
      className="admin-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`admin-modal ${sizeClasses[size]} ${className}`} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="admin-modal-header">
          <h2 id="modal-title" className="admin-modal-title">{title}</h2>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="admin-btn-ghost p-1.5 rounded hover:bg-admin-100"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="admin-modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

// Input component
export const AdminInput = forwardRef(function AdminInput({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}, ref) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint ? `${inputId}-hint` : undefined

  return (
    <div className="admin-form-group">
      {label && <label htmlFor={inputId} className="admin-label">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className={`admin-input ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${errorId || ''} ${hintId || ''}`.trim() || undefined}
        {...props}
      />
      {error && <p id={errorId} className="text-sm text-danger-600 mt-1" role="alert">{error}</p>}
      {hint && !error && <p id={hintId} className="text-sm text-admin-500 mt-1">{hint}</p>}
    </div>
  )
})

AdminInput.displayName = 'AdminInput'

// Textarea component
export const AdminTextarea = forwardRef(function AdminTextarea({
  label,
  error,
  hint,
  className = '',
  rows = 4,
  id,
  ...props
}, ref) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${inputId}-error` : undefined
  const hintId = hint ? `${inputId}-hint` : undefined

  return (
    <div className="admin-form-group">
      {label && <label htmlFor={inputId} className="admin-label">{label}</label>}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`admin-input ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${errorId || ''} ${hintId || ''}`.trim() || undefined}
        {...props}
      />
      {error && <p id={errorId} className="text-sm text-danger-600 mt-1" role="alert">{error}</p>}
      {hint && !error && <p id={hintId} className="text-sm text-admin-500 mt-1">{hint}</p>}
    </div>
  )
})

AdminTextarea.displayName = 'AdminTextarea'

// Select component
export const AdminSelect = forwardRef(function AdminSelect({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  className = '',
  id,
  ...props
}, ref) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${selectId}-error` : undefined
  const hintId = hint ? `${selectId}-hint` : undefined

  return (
    <div className="admin-form-group">
      {label && <label htmlFor={selectId} className="admin-label">{label}</label>}
      <select
        ref={ref}
        id={selectId}
        className={`admin-input ${error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : ''} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${errorId || ''} ${hintId || ''}`.trim() || undefined}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p id={errorId} className="text-sm text-danger-600 mt-1" role="alert">{error}</p>}
      {hint && !error && <p id={hintId} className="text-sm text-admin-500 mt-1">{hint}</p>}
    </div>
  )
})

AdminSelect.displayName = 'AdminSelect'

// Checkbox component
export const AdminCheckbox = forwardRef(function AdminCheckbox({
  label,
  className = '',
  id,
  ...props
}, ref) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex items-start gap-3">
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        className="mt-1 w-4 h-4 rounded border-admin-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
        {...props}
      />
      {label && <label htmlFor={checkboxId} className="text-sm text-admin-700 cursor-pointer">{label}</label>}
    </div>
  )
})

AdminCheckbox.displayName = 'AdminCheckbox'

// Button component - re-export with admin prefix
export const AdminButton = forwardRef(function AdminButton({
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  children,
  ...props
}, ref) {
  const variantClasses = {
    primary: 'admin-btn-primary',
    secondary: 'admin-btn-secondary',
    ghost: 'admin-btn-ghost',
    danger: 'admin-btn-danger',
    outline: 'admin-btn-outline',
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  }

  return (
    <button
      ref={ref}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

AdminButton.displayName = 'AdminButton'

// Form row layout helpers
export function FormRow({ children, className = '', cols = 2 }) {
  return (
    <div className={`admin-form-row-${cols} ${className}`}>
      {children}
    </div>
  )
}

export function FormSection({ title, children, className = '', description }) {
  return (
    <div className={`admin-section ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="admin-section-title">{title}</h3>
          {description && <p className="text-sm text-admin-500 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// Confirmation dialog
export function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  loading = false,
}) {
  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-admin-700">{message}</p>
        <div className="admin-modal-footer">
          <AdminButton
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </AdminButton>
          <AdminButton
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
          >
            {confirmText}
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  )
}