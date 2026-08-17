import { forwardRef } from 'react'

const Avatar = forwardRef(({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  className = '',
  ...props
}, ref) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  }

  const shapes = {
    circle: 'rounded-full',
    square: 'rounded-xl',
    rounded: 'rounded-lg',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  }

  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
    offline: 'bg-gray-400',
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const getColorFromName = (name) => {
    if (!name) return 'bg-primary-100 text-primary-700'
    const colors = [
      'bg-primary-100 text-primary-700',
      'bg-green-100 text-green-700',
      'bg-amber-100 text-amber-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-orange-100 text-orange-700',
      'bg-teal-100 text-teal-700',
      'bg-indigo-100 text-indigo-700',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const initials = name ? getInitials(name) : '?'
  const bgClass = src ? '' : getColorFromName(name)

  return (
    <div ref={ref} className={`relative inline-flex ${className}`} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`${sizes[size]} ${shapes[shape]} object-cover`}
        />
      ) : (
        <div
          className={`
            inline-flex items-center justify-center
            ${sizes[size]}
            ${shapes[shape]}
            ${bgClass}
            font-medium select-none
          `}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 border-2 border-white
            ${statusSizes[size]}
            rounded-full
            ${statusColors[status]}
          `}
          aria-label={status}
        />
      )}
    </div>
  )
})

Avatar.displayName = 'Avatar'

export default Avatar