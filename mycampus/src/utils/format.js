// Formatting helpers
export const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return d.toLocaleDateString('en-IN', options)
}

export const formatDateDetailed = (dateStr) => {
  const d = new Date(dateStr)
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return d.toLocaleDateString('en-IN', options)
}

export const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 === 0 ? 12 : h % 12
  return `${displayHour}:${minutes} ${period}`
}

export const formatDateTime = (dateStr, timeStr) => {
  return `${formatDate(dateStr)} · ${formatTime(timeStr)}`
}

export const daysUntil = (dateStr) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
  return diff
}

export const getRelativeDate = (dateStr) => {
  const diff = daysUntil(dateStr)
  if (diff < 0) return `${Math.abs(diff)} days ago`
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return `${diff} days left`
  return formatDate(dateStr)
}

export const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const truncate = (str, len = 120) => {
  if (!str) return ''
  if (str.length <= len) return str
  return str.slice(0, len).trim() + '…'
}

export const formatCurrency = (amount) => {
  if (!amount) return ''
  return amount
}

export const getScoreColor = (score) => {
  if (score >= 9) return '#16a34a'
  if (score >= 8) return '#2563eb'
  if (score >= 7) return '#d97706'
  if (score >= 6) return '#ea580c'
  return '#dc2626'
}

export const getGradeColor = (grade) => {
  switch (grade) {
    case 'A+': return '#16a34a'
    case 'A': return '#22c55e'
    case 'B+': return '#3b82f6'
    case 'B': return '#60a5fa'
    case 'C': return '#f59e0b'
    default: return '#ef4444'
  }
}

export const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return num.toString()
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'open':
    case 'upcoming':
    case 'recruiting':
    case 'active':
    case 'hiring':
    case 'published':
      return 'success'
    case 'closed':
    case 'past':
    case 'filled':
      return 'danger'
    case 'full':
    case 'deadline-near':
      return 'warning'
    default:
      return 'gray'
  }
}

export const getVisibilityBadge = (visibility) => {
  if (visibility === 'cross-university') {
    return { label: 'Cross-University', color: 'primary', icon: '🌐' }
  }
  return { label: 'Campus Only', color: 'gray', icon: '🔒' }
}