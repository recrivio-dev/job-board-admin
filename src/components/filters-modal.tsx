import { RxCross2 } from "react-icons/rx";
import { FaCheck } from "react-icons/fa6";
import { useEffect, memo, useCallback } from "react";

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
  // tempFilter: CandidateFilters;
  filterOptions: FilterOption[];
  onClearAll: () => void;
  onApply: () => void;
}

// Enhanced display label mappings
const getDisplayLabel = (value: string, filterId: string): string => {
  // Sort options mapping
  const sortLabels: { [key: string]: string } = {
    name_asc: "Name (A-Z)",
    name_desc: "Name (Z-A)",
    date_desc: "Most Recent",
    date_asc: "Oldest First",
  };

  // Apply mappings based on filter type
  switch (filterId.toLowerCase()) {
    case "sortby":
    case "sort":
      return sortLabels[value] || value;

    case "status":
      // Capitalize first letter, rest lowercase
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

    default:
      return value;
  }
};

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
    <label className="flex items-center gap-2 cursor-pointer py-1 mb-0 hover:bg-neutral-50 rounded px-2 transition-colors">
      {type === "checkbox" ? (
        <div className="relative w-5 h-5 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onChange}
            value={filterId === "status" ? option.toLowerCase() : option}
            className="sr-only"
          />
          <div
            className={`
            w-5 h-5 border-2 rounded-sm transition-all duration-150 flex items-center justify-center
            ${
              isSelected
                ? "bg-[#359A57] border-[#359A57]"
                : "border-neutral-300 bg-white hover:border-neutral-400"
            }
          `}
          >
            {isSelected && <FaCheck className="w-4 h-4 text-white" />}
          </div>
        </div>
      ) : (
        <input
          type="radio"
          checked={isSelected}
          name={filterId} // Ensure radio buttons are grouped by filter ID
          onChange={onChange}
          value={option}
          className={`
            w-5 h-5 cursor-pointer transition-all duration-150
            appearance-none border border-neutral-300 rounded-full relative
            checked:border-neutral-300 checked:before:content-[''] checked:before:absolute 
            checked:before:inset-0.5 checked:before:bg-[#359A57] checked:before:rounded-full
            focus:ring-1 focus:ring-neutral-300 focus:ring-opacity-50 focus:outline-none
            hover:border-neutral-400
          `}
        />
      )}
      <span className="text-sm text-neutral-500 select-none">{value}</span>
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
        <h3 className="font-medium text-base mb-5 text-neutral-900">
          {filter.label}
        </h3>
        <div
          className={`${
            filter.label === "Active Jobs"
              ? "grid grid-cols-1 sm:grid-cols-2"
              : "flex flex-wrap"
          } pb-5 gap-3 border-b border-neutral-200`}
        >
          {filter.options.map((option, index) => (
            <FilterOptionItem
              key={index}
              filterId={filter.id}
              option={option} // Keep original value for form submission
              value={getDisplayLabel(option, filter.id)} // Use formatted display label
              type={filter.type}
              isSelected={
                Array.isArray(filter.selected)
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
  ({ show, onClose, filterOptions, onClearAll, onApply }) => {
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
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
        document.body.style.overflow = "unset";
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
        <div className="bg-white rounded-lg shadow-xl max-w-[720px] w-full mx-4 max-h-[800px] h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-neutral-900">
                All Filters
              </h2>
              {totalSelectedFilters > 0 && (
                <span className="bg-[#1E5CDC] text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {totalSelectedFilters} selected
                </span>
              )}
            </div>
            <button
              className="text-neutral-900 hover:text-black transition-colors p-1 rounded-full hover:bg-neutral-100"
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
          <div className="flex gap-3 justify-end rounded-b-lg items-center p-6 border-t border-neutral-200 bg-neutral-50">
            <button
              className="px-4 py-2 text-sm text-neutral-500 border border-neutral-500 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              onClick={onClearAll}
              disabled={totalSelectedFilters === 0}
            >
              Clear All
            </button>
            <button
              className="px-4 py-2 text-sm bg-[#1E5CDC] text-white rounded-lg hover:bg-[#1A4BB8] transition-colors font-medium shadow-sm cursor-pointer"
              onClick={onApply}
            >
              Show Results
              {/* {totalSelectedFilters > 0 && ` (${totalSelectedFilters})`} */}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

FiltersModal.displayName = "FiltersModal";

export default FiltersModal;
