import { forwardRef } from 'react'

const Card = forwardRef(({
  children,
  className = '',
  hover = false,
  interactive = false,
  padding = 'md',
  ...props
}, ref) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      ref={ref}
      className={`
        bg-white rounded-2xl border border-gray-100 shadow-card dark:bg-gray-800/80 dark:border-gray-700/60 dark:shadow-dark-card
        ${paddings[padding]}
        ${hover ? 'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1' : ''}
        ${interactive ? 'cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

// Card sub-components
const CardHeader = forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
))
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(({ children, className = '', ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
))
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(({ children, className = '', ...props }, ref) => (
  <p ref={ref} className={`text-sm text-gray-500 mt-1 ${className}`} {...props}>
    {children}
  </p>
))
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={className} {...props}>
    {children}
  </div>
))
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 ${className}`} {...props}>
    {children}
  </div>
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }