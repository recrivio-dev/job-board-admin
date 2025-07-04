import React, { useState, useEffect, useRef } from 'react';
import { FaCaretDown } from 'react-icons/fa';
import { BiCheck } from 'react-icons/bi';
import { div } from 'motion/react-client';

const MultiSelectDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  className = "",
  searchPlaceholder = "Search"
}: {
  options: Array<{ value: string; label: string }>;
  selectedValues: string[] | string;
  onChange: (values: string[]) => void;
  placeholder: string;
  className?: string;
  searchPlaceholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(""); // Clear search when closing
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionToggle = (value: string) => {
    const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onChange(newValues);
  };

  const getDisplayText = () => {
    const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
    if (currentValues.length === 0) return placeholder;
    if (currentValues.length === 1) {
      const option = options.find(opt => opt.value === currentValues[0]);
      return option?.label || currentValues[0];
    }
    return `${currentValues.length} selected`;
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentValues = Array.isArray(selectedValues) ? selectedValues : [];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Button - Styled like FilterDropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 font-medium cursor-pointer
          border px-4 py-2 rounded-3xl transition-all duration-200 min-w-[120px]
          ${currentValues.length > 0
            ? 'border-blue-500 bg-blue-600 text-white hover:border-blue-600' 
            : 'border-neutral-500 text-neutral-700 hover:border-neutral-700 hover:bg-neutral-50'
          }
          hover:shadow-sm
          ${isOpen ? 'ring-2 ring-blue-200 border-blue-500' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-xs">
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1">
          <FaCaretDown 
            className={`w-4 h-4 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''}
                  ${
                  currentValues.length > 0 ? 'text-white' : 'text-neutral-500'
            }`} 
          />
        </div>
      </button>

      {/* Dropdown Menu - Styled like FilterDropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-52 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden"
          role="listbox"
        >
          {/* Search Input - Only for Company */}
          {placeholder === "Company" && (
            <div className="p-3 border-b border-neutral-100">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Options Container */}
          <div 
            className="py-2 overflow-y-auto"
            style={{ maxHeight: '240px' }}
          >
            {/* Options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <label
                  key={index}
                  className={`
                  flex items-center px-4 py-2.5 text-sm transition-colors cursor-pointer
                  hover:bg-neutral-50
                  ${currentValues.includes(option.value) ? 'font-medium bg-blue-50 text-blue-700' : ''}
                  `}
                >
                  <div className="mr-3 flex items-center">
                  {currentValues.includes(option.value) ? (
                    <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                      <BiCheck className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 border border-neutral-300 rounded"></div>
                  )}
                  </div>
                  <span className="truncate">{option.label}</span>
                  <input
                  type="checkbox"
                  checked={currentValues.includes(option.value)}
                  onChange={() => handleOptionToggle(option.value)}
                  className="sr-only"
                  />
                </label>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-neutral-500">
                <div className="mb-2">🔍</div>
                <div>No options found</div>
                <div className="text-xs mt-1">Try a different search term</div>
              </div>
            )}
          </div>

          {/* Footer - Clear all button */}
          {currentValues.length > 0 && (
            <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all ({currentValues.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;