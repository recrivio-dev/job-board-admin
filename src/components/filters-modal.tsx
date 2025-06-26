import { RxCross2 } from "react-icons/rx";
import { useEffect, memo, useCallback } from "react";

interface FilterOption {
  id: string;
  label: string;
  type: "radio" | "checkbox";
  options: readonly string[];
  selected: string[];
  onChange: (option: string) => void;
}

interface FiltersModalProps {
  show: boolean;
  onClose: () => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  filterOptions: FilterOption[];
  onClearAll: () => void;
  onApply: () => void;
}

// Simple filter option component
const FilterOptionItem = memo(
  ({
    option,
    type,
    isSelected,
    onChange,
  }: {
    option: string;
    type: "radio" | "checkbox";
    isSelected: boolean;
    onChange: () => void;
  }) => (
    <label className="flex items-center gap-2 cursor-pointer py-1">
      <input
        type={type}
        checked={isSelected}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{option}</span>
    </label>
  )
);

FilterOptionItem.displayName = "FilterOptionItem";

// Simple filter section
const FilterSection = memo(
  ({
    filter,
    onOptionChange,
  }: {
    filter: FilterOption;
    onOptionChange: (option: string) => void;
  }) => {
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 text-gray-900">{filter.label}</h3>
        <div className="space-y-2">
          {filter.options.map((option, index) => (
            <FilterOptionItem
              key={index}
              option={option}
              type={filter.type}
              isSelected={filter.selected.includes(option)}
              onChange={() => onOptionChange(option)}
            />
          ))}
        </div>
      </div>
    );
  }
);

FilterSection.displayName = "FilterSection";

// Simple sort options
const SortOptions = memo(
  ({
    sortBy,
    setSortBy,
  }: {
    sortBy: string;
    setSortBy: (v: string) => void;
  }) => {
    const sortOptions = [
      { value: "az", label: "Name (A-Z)" },
      { value: "za", label: "Name (Z-A)" },
      { value: "recent", label: "Most Recent" },
    ];

    return (
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 text-gray-900">Sort By</h3>
        <div className="space-y-2">
          {sortOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="radio"
                checked={sortBy === option.value}
                onChange={() => setSortBy(option.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }
);

SortOptions.displayName = "SortOptions";

const FiltersModal: React.FC<FiltersModalProps> = memo(
  ({
    show,
    onClose,
    sortBy,
    setSortBy,
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

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Filters</h2>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <RxCross2 className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sort Options */}
              <div className="md:col-span-2">
                <SortOptions sortBy={sortBy} setSortBy={setSortBy} />
              </div>
              
              {/* Filter Sections */}
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
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <button
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={onClearAll}
            >
              Clear All
            </button>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={onApply}
              >
                Apply Filters
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
