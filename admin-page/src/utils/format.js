// Date/number/string utilities for admin panel

export const formatDate = (date, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', options)
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const getRelativeDate = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0) return `In ${diffDays} days`
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
  return formatDate(date)
}

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return new Intl.NumberFormat('en-IN').format(num)
}

export const truncate = (str, length = 100) => {
  if (!str) return ''
  return str.length > length ? `${str.substring(0, length)}...` : str
}

export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toTitleCase = (str) => {
  if (!str) return ''
  return str.replace(/[-_]/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
}

// Status helpers
export const statusClasses = {
  published: 'admin-badge-success',
  draft: 'admin-badge-gray',
  archived: 'admin-badge-gray',
  pending: 'admin-badge-warning',
  approved: 'admin-badge-success',
  rejected: 'admin-badge-danger',
  verified: 'admin-badge-success',
  unverified: 'admin-badge-warning',
  open: 'admin-badge-success',
  closed: 'admin-badge-gray',
  urgent: 'admin-badge-danger',
  high: 'admin-badge-warning',
  normal: 'admin-badge-info',
  low: 'admin-badge-gray',
  active: 'admin-badge-success',
  inactive: 'admin-badge-gray',
  superadmin: 'admin-badge-info',
  moderator: 'admin-badge-info',
  exams: 'admin-badge-warning',
  placements: 'admin-badge-warning',
  content: 'admin-badge-warning',
}

export const statusDotClasses = {
  published: 'success',
  draft: 'gray',
  archived: 'gray',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  verified: 'success',
  unverified: 'warning',
  open: 'success',
  closed: 'gray',
  urgent: 'danger',
  high: 'warning',
  normal: 'info',
  low: 'gray',
  active: 'success',
  inactive: 'gray',
}

// Guard against Date.now() in some environments
export const now = () => new Date()
