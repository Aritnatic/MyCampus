import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '', showClose = true }) => {
  const overlayRef = useRef(null)
  const contentRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      document.body.style.overflow = 'hidden'
      contentRef.current?.focus()
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Tab') trapFocus(e)
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleKeyDown)
        previousActiveElement.current?.focus()
      }
    }
  }, [isOpen, onClose])

  const trapFocus = (e) => {
    if (!contentRef.current) return
    const focusableElements = contentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={contentRef}
          tabIndex={-1}
          className={`
            w-full ${sizes[size]} bg-white rounded-2xl shadow-xl animate-scale-in dark:bg-gray-800 dark:border-gray-700
            ${className}
          `}
        >
          {(title || showClose) && (
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              {title && (
                <h2 id="modal-title" className="text-xl font-semibold text-gray-900 pr-4 dark:text-gray-100">
                  {title}
                </h2>
              )}
              {showClose && (
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default Modal