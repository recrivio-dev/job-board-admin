import { RxCross2 } from "react-icons/rx";
import { useEffect, memo, useCallback } from "react";
import type { CandidateFilters } from "@/store/features/candidatesSlice";

interface FilterOption {
  id: string;
  label: string;
  type: "radio" | "checkbox";
  options: readonly string[];
  selected: string | string[];
  onChange: (option: string) => void;
}

interface FiltersModalProps {
  show: boolean;
  onClose: () => void;
  tempFilter: CandidateFilters;
  filterOptions: FilterOption[];
  onClearAll: () => void;
  onApply: () => void;
}

// Enhanced display label mappings
const getDisplayLabel = (value: string, filterId: string): string => {
  // Sort options mapping
  const sortLabels: { [key: string]: string } = {
    'name_asc': 'Name (A-Z)',
    'name_desc': 'Name (Z-A)',
    'date_desc': 'Most Recent',
    'date_asc': 'Oldest First',
    'relevance': 'Most Relevant',
    'experience_desc': 'Most Experienced',
    'experience_asc': 'Least Experienced',
  };

  // Apply mappings based on filter type
  switch (filterId.toLowerCase()) {
    case 'sortby':
    case 'sort':
      return sortLabels[value] || value;
    
    case 'status':
      // Capitalize first letter, rest lowercase
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    
    default:
      return value
  }
};

// Simple filter option component
const FilterOptionItem = memo(
  ({
    option,
    value,
    filterId,
    type,
    isSelected,
    onChange,
  }: {
    option: string;
    value?: string;
    filterId: string;
    type: "radio" | "checkbox";
    isSelected: boolean;
    onChange: () => void;
  }) => (
    <label className="flex items-center gap-2 cursor-pointer py-1 mb-0 hover:bg-gray-50 rounded px-2 transition-colors">
      <input
        type={type}
        checked={isSelected}
        onChange={onChange}
        value={filterId === "status" ? option.toLowerCase() : option}
        className={`
          w-4 h-4 cursor-pointer transition-all duration-150
          ${type === 'radio' 
            ? `appearance-none border-2 border-gray-300 rounded-full relative
               checked:border-[#359A57] checked:before:content-[''] checked:before:absolute 
               checked:before:inset-0.5 checked:before:bg-[#359A57] checked:before:rounded-full
               focus:ring-2 focus:ring-[#359A57] focus:ring-opacity-50 focus:outline-none
               hover:border-gray-400`
            : `text-[#359A57] border-gray-300 rounded focus:ring-[#359A57] focus:ring-2`
          }
        `}
      />
      <span className="text-sm text-gray-700 select-none font-medium">
        {value}
      </span>
    </label>
  )
);

FilterOptionItem.displayName = "FilterOptionItem";

// Enhanced filter section
const FilterSection = memo(
  ({
    filter,
    onOptionChange,
  }: {
    filter: FilterOption;
    onOptionChange: (option: string) => void;
  }) => {
    return (
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4 text-gray-900">
          {filter.label}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-gray-200 pb-6">
          {filter.options.map((option) => (
            <FilterOptionItem
              key={option}
              filterId={filter.id}
              option={option} // Keep original value for form submission
              value={getDisplayLabel(option, filter.id)} // Use formatted display label
              type={filter.type}
              isSelected={Array.isArray(filter.selected) 
                ? filter.selected.includes(option)
                : filter.selected === option
              }
              onChange={() => onOptionChange(option)}
            />
          ))}
        </div>
      </div>
    );
  }
);

FilterSection.displayName = "FilterSection";

const FiltersModal: React.FC<FiltersModalProps> = memo(
  ({
    show,
    onClose,
    filterOptions,
    onClearAll,
    onApply,
  }) => {
    const handleEscapeKey = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }
      },
      [onClose]
    );

    useEffect(() => {
      if (show) {
        document.addEventListener("keydown", handleEscapeKey);
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }, [show, handleEscapeKey]);

    if (!show) return null;

    // Count total selected filters
    const totalSelectedFilters = filterOptions.reduce((total, filter) => {
      if (Array.isArray(filter.selected)) {
        return total + filter.selected.length;
      }
      return total + (filter.selected ? 1 : 0);
    }, 0);

    return (
      <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">All Filters</h2>
              {totalSelectedFilters > 0 && (
                <span className="bg-[#359A57] text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {totalSelectedFilters} selected
                </span>
              )}
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              onClick={onClose}
              aria-label="Close filters modal"
            >
              <RxCross2 className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {filterOptions.map((filter) => (
                <FilterSection
                  key={filter.id}
                  filter={filter}
                  onOptionChange={filter.onChange}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <button
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              onClick={onClearAll}
              disabled={totalSelectedFilters === 0}
            >
              Clear All
            </button>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-[#359A57] text-white rounded-lg hover:bg-[#2d7a47] transition-colors font-medium shadow-sm"
                onClick={onApply}
              >
                Apply Filters
                {totalSelectedFilters > 0 && ` (${totalSelectedFilters})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FiltersModal.displayName = "FiltersModal";

export default FiltersModal;