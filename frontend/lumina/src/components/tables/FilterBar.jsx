import { useRef } from 'react'
import useDebounce from '../../hooks/useDebounce'
import { useEffect } from 'react'

const FilterBar = ({
  searchValue,
  onSearchChange,
  filters = [],
  onFilterChange,
  filterValues = {},
  placeholder = 'Search...',
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-b border-gray-200">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-9"
        />
      </div>

      {/* Filter Dropdowns */}
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filterValues[filter.key] || ''}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
          className="input-field w-auto min-w-32"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}

export default FilterBar