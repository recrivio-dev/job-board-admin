import React, { useState, useEffect, useRef } from 'react';
import { TiArrowSortedDown } from 'react-icons/ti';
import { CiSearch } from 'react-icons/ci';
import { IoClose } from 'react-icons/io5';

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
    <div className={`relative ${className} min-w-[120px]`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent text-neutral-600 text-xs font-medium border border-neutral-300 rounded-full px-4 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-neutral-500 transition-colors cursor-pointer text-left"
      >
        {getDisplayText()}
      </button>
      <TiArrowSortedDown 
        className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none transition-transform w-4 h-4 ${
          isOpen ? 'rotate-180' : ''
        }`} 
      />
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          { placeholder==="Company" ? (
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-2">
              <div className="relative">
                <CiSearch className="absolute left-1 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-7 pr-6 py-2 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <IoClose className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Options List */}
          <div className="max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center px-3 py-2 hover:bg-neutral-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentValues.includes(option.value)}
                    onChange={() => handleOptionToggle(option.value)}
                    className="mr-3 rounded border-neutral-300 focus:ring-blue-300"
                  />
                  <span className="text-xs text-neutral-700">{option.label}</span>
                </label>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-neutral-500 text-center">
                No options found
              </div>
            )}
          </div>

          {/* Footer - Only show when there are selected values */}
          {currentValues.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-3 py-2">
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