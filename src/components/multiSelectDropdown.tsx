import { useState, useEffect, useRef, useMemo } from "react";
import { FaCaretDown } from "react-icons/fa";

const MultiSelectDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  className = "",
  searchPlaceholder = "Search",
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

  // Normalize selectedValues to always be an array and memoize it
  const normalizedSelectedValues = useMemo(() => {
    if (!selectedValues) return [];
    if (Array.isArray(selectedValues)) return selectedValues;
    return [selectedValues];
  }, [selectedValues]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm(""); // Clear search when closing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionToggle = (value: string) => {
    const newValues = normalizedSelectedValues.includes(value)
      ? normalizedSelectedValues.filter((v) => v !== value)
      : [...normalizedSelectedValues, value];

    // Always call onChange, even with empty array
    onChange(newValues);
  };

  const getDisplayText = () => {
    if (normalizedSelectedValues.length === 0) return placeholder;
    if (normalizedSelectedValues.length === 1) {
      const option = options.find(
        (opt) => opt.value === normalizedSelectedValues[0]
      );
      return option?.label || normalizedSelectedValues[0];
    }
    return `${normalizedSelectedValues.length} selected`;
  };

  // Filter options based on search term
  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Button - Styled like FilterDropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 font-medium cursor-pointer
          border px-4 py-2 rounded-3xl transition-all duration-200 min-w-[120px]
          ${
            normalizedSelectedValues.length > 0
              ? "border-blue-500 bg-blue-600 text-white hover:border-blue-600"
              : "border-neutral-500 text-neutral-700 hover:border-neutral-700 hover:bg-neutral-50"
          }
          hover:shadow-sm
          ${isOpen ? "ring-2 ring-blue-200 border-blue-500" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-xs">{getDisplayText()}</span>
        <div className="flex items-center gap-1">
          <FaCaretDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }
                  ${
                    normalizedSelectedValues.length > 0
                      ? "text-white"
                      : "text-neutral-500"
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
          <div className="py-2 overflow-y-auto" style={{ maxHeight: "240px" }}>
            {/* Options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                return (
                  <label
                    key={option.value}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={normalizedSelectedValues.includes(option.value)}
                      onChange={() => handleOptionToggle(option.value)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    {option.label}
                  </label>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm text-neutral-500">
                <div className="mb-2">🔍</div>
                <div>No options found</div>
                <div className="text-xs mt-1">Try a different search term</div>
              </div>
            )}
          </div>

          {/* Footer - Clear all button */}
          {normalizedSelectedValues.length > 0 && (
            <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all ({normalizedSelectedValues.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
