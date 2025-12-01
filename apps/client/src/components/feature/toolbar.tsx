import { Download, Search } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import Button from "../ui/button";
import Select from "../ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

interface Props {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  filters?: Filter[];
  onFilterChange?: (key: string, value: string) => void;
  filterValues?: Record<string, string>;
  showExport?: boolean;
  onExport?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function Toolbar({
  onSearch,
  searchPlaceholder = "Search...",
  searchValue,
  filters,
  onFilterChange,
  filterValues = {},
  showExport = false,
  onExport,
  actions,
  children,
  className = "",
}: Props) {
  const [searchQuery, setSearchQuery] = useState(searchValue || "");
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchValue !== undefined) {
      setSearchQuery(searchValue);
    }
  }, [searchValue]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      onSearch?.(searchQuery);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const handleFilterChange = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange?.(key, e.target.value);
  };

  return (
    <div className={`flex flex-col md:flex-row md:items-center gap-2 ${className}`}>
      {onSearch && (
        <div className="w-full md:flex-1">
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
              className="block w-full pl-10 pr-2 py-2 border border-border rounded-sm leading-5 bg-foreground placeholder-text-muted focus:outline-none focus:border-primary focus:border-primary text-sm text-text-muted caret-primary"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {filters && filters.map(filter => (
          <div key={filter.key} className="min-w-[150px]">
            <Select
              options={filter.options}
              value={filterValues[filter.key] || ""}
              onChange={handleFilterChange(filter.key)}
              placeholder={filter.placeholder || `Filter by ${filter.label}`}
              className="h-[38px]"
            />
          </div>
        ))}

        {showExport && onExport && (
          <Button onClick={onExport}>
            <Download size={16} />
            Export
          </Button>
        )}

        {actions}
        {children}
      </div>
    </div>
  );
}

export default Toolbar;
