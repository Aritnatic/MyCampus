import React, { forwardRef, useId } from 'react'
import { Search, X, Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  className = '',
  id: providedId,
  ...props
}, ref) => {
  const generatedId = useId()
  const id = providedId || generatedId
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = props.type === 'password'

  const type = isPassword && !showPassword ? 'password' : 'text'

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`
            w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500' : ''}
            ${leftIcon ? 'pl-11' : ''}
            ${(rightIcon || showPasswordToggle) ? 'pr-11' : ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {(rightIcon || (showPasswordToggle && isPassword)) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {rightIcon && <span className="text-gray-400">{rightIcon}</span>}
            {showPasswordToggle && isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
          <X className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// SearchInput variant
const SearchInput = forwardRef(({
  placeholder = 'Search...',
  value,
  onChange,
  className = '',
  ...props
}, ref) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
    <input
      ref={ref}
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`
        w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
        transition-all duration-200
      `}
      {...props}
    />
  </div>
))

SearchInput.displayName = 'SearchInput'

export { Input, SearchInput }