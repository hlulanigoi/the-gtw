import { Search, Filter, X } from 'lucide-react'
import { useState } from 'react'

interface SearchFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: Array<{
    key: string
    label: string
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
  }>
  placeholder?: string
}

export default function SearchFilter({
  searchValue,
  onSearchChange,
  filters = [],
  placeholder = 'Search...',
}: SearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 p-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  >
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
