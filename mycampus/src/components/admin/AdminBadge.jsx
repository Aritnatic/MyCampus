import React from 'react'

// Minimal status badges for admin pages
const AdminBadge = ({ status, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    // Status variants
    published: 'bg-green-50 text-green-700',
    draft: 'bg-gray-50 text-gray-700',
    archived: 'bg-gray-100 text-gray-500',
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    verified: 'bg-green-50 text-green-700',
    unverified: 'bg-amber-50 text-amber-700',
    open: 'bg-green-50 text-green-700',
    closed: 'bg-gray-50 text-gray-700',
    urgent: 'bg-red-50 text-red-700',
    high: 'bg-orange-50 text-orange-700',
    normal: 'bg-blue-50 text-blue-700',
    low: 'bg-gray-50 text-gray-700',
    // Generic variants
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    default: 'bg-gray-50 text-gray-700',
  }

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  const label = typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : status

  return (
    <span className={`inline-flex items-center font-medium rounded ${sizes[size]} ${variants[variant] || variants.default} ${className}`}>
      {label}
    </span>
  )
}

// Dot indicator variant
const AdminStatusDot = ({ status, className = '' }) => {
  const colors = {
    published: 'bg-green-500',
    draft: 'bg-gray-400',
    archived: 'bg-gray-300',
    pending: 'bg-amber-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    verified: 'bg-green-500',
    unverified: 'bg-amber-500',
    open: 'bg-green-500',
    closed: 'bg-gray-400',
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-400',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    default: 'bg-gray-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${colors[status] || colors.default}`} />
      <span className="text-xs font-medium text-gray-600 capitalize">{status}</span>
    </span>
  )
}

export { AdminBadge, AdminStatusDot }