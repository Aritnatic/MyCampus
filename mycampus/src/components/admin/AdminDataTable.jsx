import React, { useEffect, useRef } from 'react'
import { AdminTable, createColumn } from './AdminTable'
import { AdminBadge, AdminStatusDot } from './AdminBadge'
import { Search, ChevronUp, ChevronDown, Minus, Square, CheckSquare } from 'lucide-react'
import { AdminButton } from './AdminForm'

export function AdminDataTable({
  columns = [],
  data = [],
  keyField = 'id',
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  sortColumn = null,
  sortDirection = 'asc',
  filters = {},
  searchQuery = '',
  selectedRows = new Set(),
  onSort,
  onFilterChange,
  onSearch,
  onPageChange,
  onRowAction,
  onRowClick,
  onSelectionChange,
  emptyMessage = 'No data available',
  loading = false,
  striped = true,
  hoverable = true,
  selectable = false,
  actionsWidth = '120px',
  className = '',
}) {
  const searchInputRef = useRef(null)

  // Focus search on Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const allSelected = data.length > 0 && selectedRows.size === data.length
  const someSelected = selectedRows.size > 0 && !allSelected

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(data.map(r => r[keyField])))
    }
  }

  const handleRowSelect = (id) => {
    onSelectionChange?.(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Add selection column if selectable
  const displayColumns = useMemo(() => {
    if (!selectable) return columns
    return [
      createColumn({
        key: '__select__',
        header: (
          <input
            type="checkbox"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            aria-label="Select all rows"
          />
        ),
        width: '48px',
        sortable: false,
        render: (_, row) => (
          <input
            type="checkbox"
            checked={selectedRows.has(row[keyField])}
            onChange={(e) => { e.stopPropagation(); handleRowSelect(row[keyField]) }}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            aria-label="Select row"
          />
        ),
      }),
      ...columns,
    ]
  }, [columns, selectable, allSelected, someSelected, selectedRows, keyField, handleRowSelect])

  // Add actions column if onRowAction provided
  const finalColumns = useMemo(() => {
    if (!onRowAction) return displayColumns
    return [
      ...displayColumns,
      createColumn({
        key: '__actions__',
        header: 'Actions',
        width: actionsWidth,
        sortable: false,
        align: 'right',
        render: (_, row) => onRowAction(row),
      }),
    ]
  }, [displayColumns, onRowAction, actionsWidth])

  if (loading) {
    return (
      <div className={`admin-table-container ${className}`}>
        <table className="admin-table" role="grid" aria-busy="true">
          <thead>
            <tr>
              {finalColumns.map(col => (
                <th key={col.key} style={{ width: col.width }}>
                  <div className="flex items-center gap-1.5 h-10">
                    <div className="h-4 bg-gray-200 animate-pulse rounded" style={{ width: col.header?.length ? '80px' : '40px' }} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {finalColumns.map(() => (
                  <td key={Math.random()}><div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={`admin-table-container admin-scrollbar-thin ${className}`} role="region" aria-label="Data table" tabIndex={0}>
      <table className="admin-table">
        <thead>
          <tr>
            {finalColumns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align || 'left', cursor: col.sortable ? 'pointer' : 'default' }}
                className={col.sortable ? 'select-none' : ''}
                onClick={() => col.sortable && onSort?.(col.key)}
                aria-sort={sortColumn === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-1.5 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {typeof col.header === 'function' ? col.header() : col.header}
                  {col.sortable && sortColumn === col.key && (
                    <span className="text-gray-400 flex-shrink-0">
                      {sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={finalColumns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Search className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-700">{emptyMessage}</p>
                  {searchQuery && (
                    <button
                      onClick={() => onSearch?.('')}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row[keyField] || rowIndex}
                className={`${hoverable ? 'hover:bg-gray-50' : ''} ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''} transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${selectedRows.has(row[keyField]) ? 'bg-primary-50' : ''}`}
                onClick={(e) => {
                  if (selectable && e.target.type !== 'checkbox' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                    handleRowSelect(row[keyField])
                  }
                  onRowClick?.(row)
                }}
              >
                {finalColumns.map((col) => (
                  <td key={`${row[keyField]}-${col.key}`} style={{ width: col.width, textAlign: col.align || 'left' }} className="px-3 py-3">
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-table-pagination flex items-center justify-between px-3 py-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{(currentPage - 1) * 15 + 1}</span> to{' '}
            <span className="font-medium text-gray-900">{Math.min(currentPage * 15, totalCount)}</span> of{' '}
            <span className="font-medium text-gray-900">{totalCount}</span> results
          </div>
          <div className="flex items-center gap-2">
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </AdminButton>
            <span className="text-sm text-gray-600 w-20 text-center">
              Page {currentPage} of {totalPages}
            </span>
            <AdminButton
              variant="ghost"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  )
}

// Need to import useMemo
import { useMemo } from 'react'