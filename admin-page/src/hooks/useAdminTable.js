import { useState, useMemo, useCallback, useEffect } from 'react'

export function useAdminTable({
  data = [],
  columns = [],
  keyField = 'id',
  defaultSort = null,
  defaultFilters = {},
  pageSize = 15,
}) {
  const [filters, setFilters] = useState(defaultFilters)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState(defaultSort?.column || null)
  const [sortDirection, setSortDirection] = useState(defaultSort?.direction || 'asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)

  // Memoized filtered & sorted data
  const processedData = useMemo(() => {
    let result = [...data]

    // Search
    if (searchQuery) {
      const searchableColumns = columns.filter(c => c.searchable !== false)
      const query = searchQuery.toLowerCase()
      result = result.filter(row =>
        searchableColumns.some(col => {
          const val = row[col.key]
          return val != null && String(val).toLowerCase().includes(query)
        })
      )
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(row => row[key] === value)
      }
    })

    // Sort
    if (sortColumn) {
      const column = columns.find(c => c.key === sortColumn)
      if (column?.sortable !== false) {
        result.sort((a, b) => {
          const aVal = a[sortColumn]
          const bVal = b[sortColumn]
          if (aVal == null) return 1
          if (bVal == null) return -1
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          return sortDirection === 'asc' ? cmp : -cmp
        })
      }
    }

    return result
  }, [data, columns, searchQuery, filters, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, currentPage, pageSize])

  // Reset page when filters/search change
  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }, [])

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  const handleSort = useCallback((key) => {
    const column = columns.find(c => c.key === key)
    if (!column?.sortable) return
    setSortColumn(prev => prev === key ? null : key)
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }, [columns])

  const handlePageChange = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  // Selection
  const toggleRowSelection = useCallback((id) => {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedRows(prev => {
      if (prev.size === paginatedData.length) return new Set()
      return new Set(paginatedData.map(r => r[keyField]))
    })
  }, [paginatedData, keyField])

  const clearSelection = useCallback(() => setSelectedRows(new Set()), [])

  // Modal management
  const openCreateModal = useCallback(() => {
    setEditingRow(null)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((row) => {
    setEditingRow(row)
    setModalOpen(true)
  }, [])

  const openViewModal = useCallback((row) => {
    setViewRow(row)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingRow(null)
    setViewRow(null)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('[data-admin-search]')
        searchInput?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return {
    // Data
    data: paginatedData,
    allData: processedData,
    totalCount: processedData.length,
    totalPages,
    currentPage,

    // State
    filters,
    searchQuery,
    sortColumn,
    sortDirection,
    selectedRows,
    modalOpen,
    editingRow,
    viewRow,

    // Actions
    setFilters,
    setSearchQuery: handleSearch,
    handleFilterChange,
    handleSort,
    handlePageChange,
    toggleRowSelection,
    toggleSelectAll,
    clearSelection,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeModal,
    setModalOpen,
    setEditingRow,
    setViewRow,
    setSelectedRows,
    setCurrentPage,
  }
}

export function useAdminForm(initialData = {}, validationRules = {}) {
  const [values, setValues] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [dirty, setDirty] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const validate = useCallback((fieldValues = values) => {
    const newErrors = {}
    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = fieldValues[field]
      if (rules.required && (!value || (Array.isArray(value) && value.length === 0))) {
        newErrors[field] = rules.message || `${field} is required`
      }
      if (rules.minLength && value?.length < rules.minLength) {
        newErrors[field] = rules.message || `Must be at least ${rules.minLength} characters`
      }
      if (rules.pattern && value && !rules.pattern.test(value)) {
        newErrors[field] = rules.message || 'Invalid format'
      }
      if (rules.custom) {
        const customError = rules.custom(value, fieldValues)
        if (customError) newErrors[field] = customError
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validationRules])

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setDirty(true)
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [errors])

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validate({ [field]: values[field] })
  }, [values, validate])

  const reset = useCallback((newValues = initialData) => {
    setValues(newValues)
    setErrors({})
    setTouched({})
    setDirty(false)
  }, [initialData])

  const setFieldValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setDirty(true)
  }, [])

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const handleSubmit = useCallback(async (onSubmit) => {
    if (!validate()) return false
    setSubmitting(true)
    try {
      await onSubmit(values)
      setDirty(false)
      return true
    } catch (error) {
      console.error('Form submit error:', error)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [values, validate])

  return {
    values,
    errors,
    touched,
    dirty,
    submitting,
    validate,
    handleChange,
    handleBlur,
    reset,
    setFieldValue,
    setFieldError,
    handleSubmit,
    setValues,
    setErrors,
    setSubmitting,
  }
}