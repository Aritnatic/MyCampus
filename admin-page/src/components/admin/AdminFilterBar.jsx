import React from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { AdminInput, AdminSelect, AdminButton } from './AdminForm'

export function AdminFilterBar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  className = '',
  showClear = true,
}) {
  const hasActiveFilters = Object.values(filterValues).some(v => v && v !== 'all')

  return (
    <div className={`admin-filter-bar flex flex-col sm:flex-row gap-4 mb-4 ${className}`}>
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
        <input
          type="search"
          data-admin-search
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="admin-input pl-10 pr-10"
        />
        {searchValue && showClear && (
          <button
            type="button"
            onClick={() => onSearchChange?.('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-400 hover:text-admin-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          {filter.type === 'select' && (
            <AdminSelect
              value={filterValues[filter.key] || 'all'}
              onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
              options={[{ value: 'all', label: filter.allLabel || 'All' }, ...filter.options]}
              className={`w-full sm:w-${filter.width || '48'}`}
              placeholder={filter.placeholder}
            />
          )}
          {filter.type === 'multiselect' && (
            <AdminMultiSelect
              value={filterValues[filter.key] || []}
              onChange={(values) => onFilterChange?.(filter.key, values)}
              options={filter.options}
              placeholder={filter.placeholder || 'Select...'}
              className={`w-full sm:w-${filter.width || '48'}`}
            />
          )}
          {filter.type === 'dateRange' && (
            <div className="flex items-center gap-2">
              <AdminInput
                type="date"
                value={filterValues[`${filter.key}Start`] || ''}
                onChange={(e) => onFilterChange?.(`${filter.key}Start`, e.target.value)}
                placeholder="From"
                className="w-36"
              />
              <span className="text-admin-400">–</span>
              <AdminInput
                type="date"
                value={filterValues[`${filter.key}End`] || ''}
                onChange={(e) => onFilterChange?.(`${filter.key}End`, e.target.value)}
                placeholder="To"
                className="w-36"
              />
            </div>
          )}
        </div>
      ))}

      {/* Clear all filters */}
      {hasActiveFilters && showClear && (
        <AdminButton
          variant="ghost"
          size="sm"
          onClick={() => {
            filters.forEach(f => onFilterChange?.(f.key, 'all'))
            onFilterChange?.('__clear__', true)
          }}
          className="flex items-center gap-1.5"
        >
          <Filter className="w-4 h-4" />
          Clear filters
        </AdminButton>
      )}
    </div>
  )
}

function AdminMultiSelect({ value = [], onChange, options = [], placeholder, className }) {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef(null)

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={buttonRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`admin-input ${className} flex items-center justify-between h-10`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {value.length === 0
            ? <span className="text-admin-400">{placeholder}</span>
            : value.length === 1
            ? options.find(o => o.value === value[0])?.label || value[0]
            : `${value.length} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 text-admin-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-admin-200 rounded-lg shadow-lg admin-scrollbar-thin max-h-48 overflow-auto">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-admin-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...value, opt.value])
                  } else {
                    onChange(value.filter(v => v !== opt.value))
                  }
                }}
                className="w-4 h-4 rounded border-admin-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-admin-700">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminQuickFilters({ filters = [], activeFilter, onChange, className = '' }) {
  return (
    <div className={`admin-quick-filters flex flex-wrap gap-2 ${className}`}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`admin-btn-${activeFilter === filter.value ? 'primary' : 'outline'} admin-btn-sm`}
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-admin-200 text-admin-600">
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}