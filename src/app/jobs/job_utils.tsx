import { GoPlus } from "react-icons/go";
import { IoList } from "react-icons/io5";
import { FaCaretDown } from "react-icons/fa";
import React, { useRef, useEffect, useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiCheck } from 'react-icons/bi';
import { IoClose } from 'react-icons/io5';

// Loading skeleton component
export const JobCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
    <div className="flex items-center mb-4">
      <div className="w-14 h-14 bg-neutral-300 rounded-xl"></div>
      <div className="flex-1 ml-4">
        <div className="h-5 bg-neutral-300 rounded mb-2"></div>
        <div className="h-4 bg-neutral-300 rounded w-3/4"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-8 bg-neutral-300 rounded-lg w-32"></div>
      <div className="h-8 bg-neutral-300 rounded-lg w-24"></div>
    </div>
    <div className="mt-4">
      <div className="h-6 bg-neutral-300 rounded w-24 ml-auto"></div>
    </div>
  </div>
);

// Empty state component
export const EmptyState: React.FC<{ onAddJob: () => void }> = ({ onAddJob }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-32 h-32 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
      <IoList className="w-16 h-16 text-neutral-400" />
    </div>
    <h3 className="text-xl font-semibold text-neutral-900 mb-2">No jobs found</h3>
    <p className="text-neutral-600 mb-6">Get started by adding your first job posting.</p>
    <button
      type="button"
      onClick={onAddJob}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 px-4 transition-colors cursor-pointer flex items-center gap-2"
    >
      <GoPlus className="h-5 w-5" />
      Add Your First Job
    </button>
  </div>
);

// Error state component
export const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-neutral-900 mb-2">Error loading jobs</h3>
    <p className="text-neutral-600 mb-6">{error}</p>
    <button
      type="button"
      onClick={onRetry}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 px-4 transition-colors cursor-pointer"
    >
      Try Again
    </button>
  </div>
);

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxHeight?: number;
  searchable?: boolean;
  showCount?: boolean;
  error?: string | null;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  loading = false,
  disabled = false,
  placeholder,
  maxHeight = 240,
  searchable = false,
  showCount = false,
  error = null,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Filter options based on search term
  const filteredOptions = searchable
    ? options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
          setSearchTerm('');
          setFocusedIndex(-1);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => prev > -1 ? prev - 1 : prev);
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex === -1) {
            // Clear selection
            handleOptionSelect('');
          } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleOptionSelect(filteredOptions[focusedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onToggle();
          setSearchTerm('');
          setFocusedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, filteredOptions, focusedIndex]);

  // Reset search and focus when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const handleOptionSelect = (selectedValue: string) => {
    onChange(selectedValue);
    onToggle();
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Get display text for the button
  const getDisplayText = () => {
    if (value) return value;
    if (placeholder) return placeholder;
    return `${label === "Job Status"?  "": "All"}${label}`;
  };

  // Check if option is selected
  const isSelected = (option: string) => value === option;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Main Button */}
      <button
        onClick={onToggle}
        disabled={disabled || loading}
        className={`
          flex items-center justify-between gap-2 font-medium cursor-pointer 
          border px-4 py-2 rounded-3xl transition-all duration-200 min-w-[120px]
          ${error 
            ? 'border-red-400 bg-red-50 text-red-700 hover:border-red-500' 
            : value 
              ? 'border-blue-500 bg-blue-50 text-blue-700 hover:border-blue-600' 
              : 'border-neutral-500 text-neutral-700 hover:border-neutral-700 hover:bg-neutral-50'
          }
          ${disabled || loading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-sm'
          }
          ${isOpen ? 'ring-2 ring-blue-200 border-blue-500' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Filter by ${label}`}
      >
        <span className="truncate text-sm">
          {getDisplayText()}
          {/* {showCount && options.length > 0 && (
            <span className="ml-1 text-xs opacity-75">
              ({options.length})
            </span>
          )} */}
        </span>
        
        <div className="flex items-center gap-1">
          {/* {value && !loading && (
            <button
              onClick={handleClearSelection}
              className="p-0.5 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
              aria-label={`Clear ${label} filter`}
            >
              <IoClose className="w-3 h-3" />
            </button>
          )}
           */}
          {loading ? (
            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin text-neutral-500" />
          ) : (
            <FaCaretDown 
              className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          )}
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 border border-red-200 rounded text-xs text-red-600 whitespace-nowrap z-50">
          {error}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && !loading && !error && (
        <div 
          className="absolute top-full left-0 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label={`${label} options`}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-3 border-b border-neutral-100">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          )}

          {/* Options Container */}
          <div 
            className="py-2 overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {/* Clear/All Option */}
            <button
              onClick={() => handleOptionSelect('')}
              className={`
                w-full text-left px-4 py-2.5 text-sm transition-colors relative
                ${focusedIndex === -1 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'hover:bg-neutral-50'
                }
                ${!value ? 'font-medium' : ''}
              `}
              role="option"
              aria-selected={!value}
            >
              <div className="flex items-center justify-between">
                <span>All {label}</span>
                {!value && <BiCheck className="w-4 h-4 text-blue-600" />}
              </div>
            </button>

            {/* Separator */}
            {filteredOptions.length > 0 && (
              <div className="border-t border-neutral-100 my-1" />
            )}

            {/* Options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm transition-colors relative
                    ${focusedIndex === index 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-neutral-50'
                    }
                    ${isSelected(option) ? 'font-medium bg-blue-50 text-blue-700' : ''}
                  `}
                  role="option"
                  aria-selected={isSelected(option)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{option}</span>
                    {isSelected(option) && (
                      <BiCheck className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))
            ) : searchable && searchTerm ? (
              <div className="px-4 py-6 text-center text-sm text-neutral-500">
                <div className="mb-2">🔍</div>
                <div>No {label.toLowerCase()} found</div>
                <div className="text-xs mt-1">Try a different search term</div>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-neutral-500">
                <div className="mb-2">📋</div>
                <div>No {label.toLowerCase()} available</div>
              </div>
            )}
          </div>

          {/* Footer with count */}
          {(showCount || searchable) && filteredOptions.length > 0 && (
            <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 text-xs text-neutral-600">
              {searchable && searchTerm ? (
                <span>
                  {filteredOptions.length} of {options.length} {label.toLowerCase()}
                </span>
              ) : (
                <span>
                  {options.length} {label.toLowerCase()}{options.length !== 1 ? 's' : ''} total
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State Overlay */}
      {isOpen && loading && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-6">
          <div className="flex items-center justify-center">
            <AiOutlineLoading3Quarters className="w-6 h-6 animate-spin text-neutral-400 mr-3" />
            <span className="text-sm text-neutral-600">Loading {label.toLowerCase()}...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Usage example with the enhanced props:
/*
<FilterDropdown
  label="Job Status"
  value={filterDropdowns.status}
  options={filterOptions.statuses}
  onChange={(value) => handleFilterChange("status", value)}
  isOpen={filterDropdowns.isOpen === "status"}
  onToggle={() => toggleFilterDropdown("status")}
  loading={filterOptionsLoading}
  searchable={true}
  showCount={true}
  placeholder="Select status..."
  error={filterOptions.error}
/>
*/
