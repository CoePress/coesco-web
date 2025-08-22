import React, { useState } from 'react'
import { Search, Download } from 'lucide-react'
import Select from '../ui/select'
import Button from '../ui/button'

export type FilterOption = {
  value: string;
  label: string;
}

export type Filter = {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

type Props = {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: Filter[];
  onFilterChange?: (key: string, value: string) => void;
  filterValues?: Record<string, string>;
  showExport?: boolean;
  onExport?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const Toolbar = ({ 
  onSearch, 
  searchPlaceholder = "Search...", 
  filters,
  onFilterChange,
  filterValues = {},
  showExport = false,
  onExport,
  children, 
  className = "" 
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch?.(searchQuery)
    }
  }

  const handleFilterChange = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange?.(key, e.target.value)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-text-muted" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="block w-full pl-10 pr-2 py-2 border border-border rounded-sm leading-5 bg-foreground placeholder-text-muted focus:outline-none focus:placeholder-text focus:ring-1 focus:ring-primary focus:border-primary text-sm text-foreground"
          />
        </div>
      </div>

      {filters && filters.map((filter) => (
        <div key={filter.key} className="min-w-[150px]">
          <Select
            options={filter.options}
            value={filterValues[filter.key] || ''}
            onChange={handleFilterChange(filter.key)}
            placeholder={filter.placeholder || `Filter by ${filter.label}`}
            className="h-[38px]"
          />
        </div>
      ))}

      {showExport && (
        <Button onClick={onExport}>
          <Download size={16} />
          Export
        </Button>
      )}

      {children}
    </div>
  )
}

export default Toolbar;