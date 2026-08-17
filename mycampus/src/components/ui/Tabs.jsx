import React, { forwardRef, useId, useContext, createContext, useState } from 'react'

const Tabs = ({ children, defaultValue, value, onValueChange, className = '', ...props }) => {
  const [activeValue, setActiveValue] = useState(defaultValue || '')
  const controlled = value !== undefined

  const currentValue = controlled ? value : activeValue

  const handleChange = (newValue) => {
    if (!controlled) setActiveValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={className} {...props}>
        {typeof children === 'function' ? children({ value: currentValue, onChange: handleChange }) : children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = forwardRef(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    aria-orientation="horizontal"
    className={`inline-flex items-center gap-1 p-1 bg-gray-100 rounded-xl ${className}`}
    {...props}
  >
    {children}
  </div>
))
TabsList.displayName = 'TabsList'

const TabsTrigger = forwardRef(({ children, value, disabled = false, className = '', ...props }, ref) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const { value: currentValue, onChange } = context
  const isActive = currentValue === value

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = forwardRef(({ children, value, className = '', ...props }, ref) => {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  const { value: currentValue } = context
  const isActive = currentValue === value

  if (!isActive) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={`animate-fade-in ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
TabsContent.displayName = 'TabsContent'

const TabsContext = React.createContext(null)

export const TabsProvider = ({ children, value, onChange }) => (
  <TabsContext.Provider value={{ value, onChange }}>
    {children}
  </TabsContext.Provider>
)

export { Tabs, TabsList, TabsTrigger, TabsContent }