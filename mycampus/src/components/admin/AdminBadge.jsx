import React from 'react'

// Status badge component - minimal, flat, no shadows
export function AdminBadge({
  children,
  status,
  variant = 'default', // 'default' | 'dot' | 'outline'
  className = '',
  size = 'sm', // 'sm' | 'md'
}) {
  const statusConfig = {
    published: { label: 'Published', class: 'admin-badge-success', dot: 'success' },
    draft: { label: 'Draft', class: 'admin-badge-gray', dot: 'gray' },
    archived: { label: 'Archived', class: 'admin-badge-gray', dot: 'gray' },
    pending: { label: 'Pending', class: 'admin-badge-warning', dot: 'warning' },
    approved: { label: 'Approved', class: 'admin-badge-success', dot: 'success' },
    rejected: { label: 'Rejected', class: 'admin-badge-danger', dot: 'danger' },
    verified: { label: 'Verified', class: 'admin-badge-success', dot: 'success' },
    unverified: { label: 'Unverified', class: 'admin-badge-warning', dot: 'warning' },
    open: { label: 'Open', class: 'admin-badge-success', dot: 'success' },
    closed: { label: 'Closed', class: 'admin-badge-gray', dot: 'gray' },
    urgent: { label: 'Urgent', class: 'admin-badge-danger', dot: 'danger' },
    high: { label: 'High', class: 'admin-badge-warning', dot: 'warning' },
    normal: { label: 'Normal', class: 'admin-badge-info', dot: 'info' },
    low: { label: 'Low', class: 'admin-badge-gray', dot: 'gray' },
    active: { label: 'Active', class: 'admin-badge-success', dot: 'success' },
    inactive: { label: 'Inactive', class: 'admin-badge-gray', dot: 'gray' },
    scheduled: { label: 'Scheduled', class: 'admin-badge-info', dot: 'info' },
    completed: { label: 'Completed', class: 'admin-badge-success', dot: 'success' },
    cancelled: { label: 'Cancelled', class: 'admin-badge-danger', dot: 'danger' },
    uploaded: { label: 'Uploaded', class: 'admin-badge-warning', dot: 'warning' },
    internship: { label: 'Internship', class: 'admin-badge-info', dot: 'info' },
    'full-time': { label: 'Full Time', class: 'admin-badge-success', dot: 'success' },
    technical: { label: 'Technical', class: 'admin-badge-info', dot: 'info' },
    cultural: { label: 'Cultural', class: 'admin-badge-warning', dot: 'warning' },
    sports: { label: 'Sports', class: 'admin-badge-success', dot: 'success' },
    academic: { label: 'Academic', class: 'admin-badge-info', dot: 'info' },
    social: { label: 'Social', class: 'admin-badge-warning', dot: 'warning' },
    alumni: { label: 'Alumni', class: 'admin-badge-gray', dot: 'gray' },
    entrepreneurship: { label: 'Entrepreneurship', class: 'admin-badge-danger', dot: 'danger' },
    superadmin: { label: 'Super Admin', class: 'admin-badge-info', dot: 'info' },
    moderator: { label: 'Moderator', class: 'admin-badge-warning', dot: 'warning' },
    exams: { label: 'Exam Controller', class: 'admin-badge-danger', dot: 'danger' },
    placements: { label: 'Placement Officer', class: 'admin-badge-warning', dot: 'warning' },
    content: { label: 'Content Manager', class: 'admin-badge-gray', dot: 'gray' },
    theory: { label: 'Theory', class: 'admin-badge-info', dot: 'info' },
    lab: { label: 'Lab', class: 'admin-badge-warning', dot: 'warning' },
  }

  const config = status ? statusConfig[status] : null
  const label = children || (config?.label || status || 'Unknown')
  const badgeClass = config?.class || 'admin-badge-gray'
  const dotClass = config?.dot || 'gray'

  if (variant === 'dot') {
    return (
      <span className={`admin-status-dot ${dotClass} ${className}`}>
        {label}
      </span>
    )
  }

  if (variant === 'outline') {
    const outlineClasses = {
      success: 'border-success-300 text-success-700 bg-success-50',
      warning: 'border-warning-300 text-warning-700 bg-warning-50',
      danger: 'border-danger-300 text-danger-700 bg-danger-50',
      info: 'border-primary-300 text-primary-700 bg-primary-50',
      gray: 'border-admin-300 text-admin-600 bg-admin-50',
    }
    return (
      <span className={`admin-badge ${outlineClasses[dotClass]} ${size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'} ${className}`}>
        {label}
      </span>
    )
  }

  return (
    <span className={`${badgeClass} ${size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'} ${className}`}>
      {label}
    </span>
  )
}

// Status dot only - for inline use
export function AdminStatusDot({ status, className = '', size = 'sm' }) {
  const dotClasses = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-primary-500',
    gray: 'bg-admin-400',
  }

  const statusMap = {
    published: 'success',
    approved: 'success',
    verified: 'success',
    open: 'success',
    active: 'success',
    completed: 'success',
    pending: 'warning',
    draft: 'gray',
    archived: 'gray',
    closed: 'gray',
    inactive: 'gray',
    rejected: 'danger',
    unverified: 'warning',
    cancelled: 'danger',
    urgent: 'danger',
    high: 'warning',
    normal: 'info',
    low: 'gray',
    scheduled: 'info',
    uploaded: 'warning',
  }

  const dotClass = status ? statusMap[status] : 'gray'
  const sizeClass = size === 'md' ? 'w-3 h-3' : 'w-2 h-2'

  return (
    <span className={`inline-block ${sizeClass} rounded-full ${dotClasses[dotClass]} ${className}`} />
  )
}