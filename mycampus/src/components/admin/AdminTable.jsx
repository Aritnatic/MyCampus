import React from 'react'

// Minimal, clean table component - no rounded cards, just borders
export function AdminTable({
  columns = [],
  data = [],
  keyField = 'id',
  onRowClick,
  className = '',
  emptyMessage = 'No data available',
  renderRowActions,
  sortable = false,
  sortColumn,
  sortDirection,
  onSort,
  striped = true,
  hoverable = true,
  bordered = true,
}) {
  if (!data.length) {
    return (
      <div className={`admin-table-container ${className}`}>
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
              {renderRowActions && <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length + (renderRowActions ? 1 : 0)} className="text-center py-12 text-admin-500">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className={`admin-table-container admin-scrollbar-thin ${className}`} style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, cursor: sortable && col.sortable ? 'pointer' : 'default' }}
                className={sortable && col.sortable ? 'select-none' : ''}
                onClick={() => sortable && col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  <span>{col.header}</span>
                  {sortable && col.sortable && sortColumn === col.key && (
                    <span className="text-admin-400">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {renderRowActions && <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row[keyField] || rowIndex}
              className={`${hoverable ? 'hover:bg-admin-50' : ''} ${striped && rowIndex % 2 === 1 ? 'bg-admin-50' : ''} transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={`${row[keyField]}-${col.key}`} style={{ width: col.width }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {renderRowActions && (
                <td style={{ width: '120px', textAlign: 'right' }}>
                  {renderRowActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Column definition helper
export function createColumn({ key, header, width, render, sortable = false, align }) {
  return { key, header, width, render, sortable, align }
}