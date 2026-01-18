import { useState, useMemo } from 'react'
import { Download, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { exportToCSV } from '../lib/export'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
  hidden?: boolean
}

interface TableProps {
  columns: Column[]
  data: any[]
  loading?: boolean
  onExport?: (format: 'csv' | 'json') => void
  exportFilename?: string
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  rowKey?: string
}

export default function Table({ 
  columns, 
  data, 
  loading, 
  onExport,
  exportFilename = 'export',
  pagination,
  rowKey = 'id'
}: TableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [showColumnSelector, setShowColumnSelector] = useState(false)

  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumns.has(col.key)),
    [columns, hiddenColumns]
  )

  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const toggleColumn = (columnKey: string) => {
    const newHidden = new Set(hiddenColumns)
    if (newHidden.has(columnKey)) {
      newHidden.delete(columnKey)
    } else {
      newHidden.add(columnKey)
    }
    setHiddenColumns(newHidden)
  }

  const handleExportCSV = () => {
    if (data.length > 0) {
      exportToCSV(data, exportFilename)
    } else {
      alert('No data to export')
    }
  }

  if (loading) {
    return (
      <div className="card" role="status" aria-live="polite">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="card" role="status">
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">No data available</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Data will appear here when available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            data-testid="column-selector-btn"
            aria-label="Toggle column visibility"
            aria-expanded={showColumnSelector}
          >
            {showColumnSelector ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm font-medium">Columns</span>
          </button>

          {showColumnSelector && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 min-w-48 animate-scale-in">
              <div className="p-2 space-y-1">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all duration-200"
          data-testid="export-csv-btn"
          aria-label="Export table data to CSV"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table">
            <thead className="bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border-b border-gray-200 dark:border-gray-700">
              <tr role="row">
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                    role="columnheader"
                    scope="col"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable !== false && (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          aria-label={`Sort by ${column.label}`}
                          data-testid={`sort-${column.key}`}
                        >
                          {sortColumn === column.key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="w-4 h-4" aria-hidden="true" />
                            )
                          ) : (
                            <div className="w-4 h-4 opacity-30">
                              <ChevronUp className="w-4 h-2" aria-hidden="true" />
                              <ChevronDown className="w-4 h-2 -mt-1" aria-hidden="true" />
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700" role="rowgroup">
              {sortedData.map((row, rowIndex) => (
                <tr 
                  key={row[rowKey] || rowIndex} 
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  role="row"
                  data-testid={`table-row-${row[rowKey] || rowIndex}`}
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"
                      role="cell"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div 
            className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50"
            role="navigation"
            aria-label="Pagination"
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
                data-testid="pagination-prev"
              >
                Previous
              </button>
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
                data-testid="pagination-next"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
