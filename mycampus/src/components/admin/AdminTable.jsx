import React from 'react'
import { forwardRef } from 'react'

// Minimal, clean table component for admin pages - no rounded cards, no shadows
const AdminTable = forwardRef(({
  columns,
  data,
  keyField = 'id',
  onRowClick,
  emptyMessage = 'No data available',
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`overflow-x-auto ${className}`} {...props}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.align || ''} ${col.className || ''}`}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row[keyField] || rowIndex}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${row._rowClass || ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={`${row[keyField] || rowIndex}-${col.key}`}
                    className={`px-4 py-3 text-sm text-gray-900 ${col.align || ''} ${col.className || ''}`}
                  >
                    {col.render ? col.render(row[row.key], row, rowIndex) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
})

AdminTable.displayName = 'AdminTable'

export default AdminTable