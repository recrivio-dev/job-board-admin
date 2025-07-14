import React, { useCallback, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import { FaCheck } from "react-icons/fa6";

// Debounce utility function
// function debounce<T extends (...args: never[]) => unknown>(
//   func: T,
//   wait: number
// ): (...args: Parameters<T>) => void {
//   let timeout: NodeJS.Timeout;
//   return (...args: Parameters<T>) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// }

// interface RangeSliderProps {
//   label: string;
//   min: number;
//   max: number;
//   step: number;
//   value: [number, number];
//   onChange: (value: [number, number]) => void;
//   formatValue?: (value: number) => string;
// }

// const RangeSlider: React.FC<RangeSliderProps> = ({
//   label,
//   min,
//   max,
//   step,
//   value,
//   onChange,
//   formatValue = (val) => val.toString(),
// }) => {
//   const [localValue, setLocalValue] = useState(value);
//   const [isDragging, setIsDragging] = useState(false);

//   useEffect(() => {
//     setLocalValue(value);
//   }, [value]);

//   const debouncedOnChange = useCallback(
//     (newValue: [number, number]) => {
//       const debouncedFn = debounce((value: [number, number]) => {
//         onChange(value);
//       }, 100);
//       debouncedFn(newValue);
//     },
//     [onChange]
//   );

//   const handleMinChange = (newMin: number) => {
//     const clampedMin = Math.min(newMin, localValue[1] - step);
//     const newValue: [number, number] = [clampedMin, localValue[1]];
//     setLocalValue(newValue);

//     if (isDragging) {
//       debouncedOnChange(newValue);
//     } else {
//       onChange(newValue);
//     }
//   };

//   const handleMaxChange = (newMax: number) => {
//     const clampedMax = Math.max(newMax, localValue[0] + step);
//     const newValue: [number, number] = [localValue[0], clampedMax];
//     setLocalValue(newValue);

//     if (isDragging) {
//       debouncedOnChange(newValue);
//     } else {
//       onChange(newValue);
//     }
//   };

//   const percentage1 = ((localValue[0] - min) / (max - min)) * 100;
//   const percentage2 = ((localValue[1] - min) / (max - min)) * 100;

//   return (
//     <div className="mb-8">
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="font-medium text-base text-neutral-900">{label}</h3>
//         <span className="text-sm text-neutral-600">
//           {formatValue(localValue[0])} - {formatValue(localValue[1])}
//         </span>
//       </div>

//       <div className="relative mb-6">
//         <div className="absolute w-full h-2 bg-neutral-200 rounded-full top-1/2 transform -translate-y-1/2"></div>
//         <div
//           className="absolute h-2 bg-blue-500 rounded-full top-1/2 transform -translate-y-1/2"
//           style={{
//             left: `${percentage1}%`,
//             width: `${percentage2 - percentage1}%`,
//           }}
//         ></div>

//         <input
//           type="range"
//           min={min}
//           max={max}
//           step={step}
//           value={localValue[0]}
//           onChange={(e) => handleMinChange(Number(e.target.value))}
//           onMouseDown={() => setIsDragging(true)}
//           onMouseUp={() => setIsDragging(false)}
//           onTouchStart={() => setIsDragging(true)}
//           onTouchEnd={() => setIsDragging(false)}
//           className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
//           style={{ zIndex: 25 }}
//         />

//         <input
//           type="range"
//           min={min}
//           max={max}
//           step={step}
//           value={localValue[1]}
//           onChange={(e) => handleMaxChange(Number(e.target.value))}
//           onMouseDown={() => setIsDragging(true)}
//           onMouseUp={() => setIsDragging(false)}
//           onTouchStart={() => setIsDragging(true)}
//           onTouchEnd={() => setIsDragging(false)}
//           className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
//           style={{ zIndex: 20 }}
//         />
//       </div>

//       <style jsx>{`
//         input[type="range"] {
//           -webkit-appearance: none;
//           appearance: none;
//           background: transparent;
//           cursor: pointer;
//         }
//         input[type="range"]::-webkit-slider-thumb {
//           -webkit-appearance: none;
//           appearance: none;
//           height: 20px;
//           width: 20px;
//           border-radius: 50%;
//           background: #3b82f6;
//           cursor: grab;
//           border: 2px solid white;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
//         }
//         input[type="range"]:active::-webkit-slider-thumb {
//           cursor: grabbing;
//           transform: scale(1.1);
//         }
//       `}</style>
//     </div>
//   );
// };

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  grid?: boolean;
  onChange: (selected: string[]) => void;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  options,
  grid = false,
  selected,
  onChange,
}) => {
  const handleOptionToggle = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  return (
    <div className="mb-8">
      <h3 className="font-medium text-base mb-5 text-neutral-900">{label}</h3>
      <div className={`${grid ? "grid grid-cols-1 sm:grid-cols-3" : "flex flex-wrap"} pb-5 gap-2 border-b border-neutral-200`}>
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-4 text-lg cursor-pointer py-1 mb-0 hover:bg-neutral-50 rounded px-2 transition-colors"
          >
            <div className="relative w-5 h-5 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => handleOptionToggle(option)}
                className="sr-only"
              />
              <div
                className={`
                w-5 h-5 border-2 rounded-sm transition-all duration-150 flex items-center justify-center
                ${
                  selected.includes(option)
                    ? "bg-green-600 border-green-600"
                    : "border-neutral-300 bg-white hover:border-neutral-400"
                }
              `}
              >
                {selected.includes(option) && (
                  <FaCheck className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
            <span className="text-sm text-neutral-500 select-none capitalize">
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

// Improved Sort Configuration
interface SortOption {
  value: string;
  label: string;
  field: string;
  order: 'asc' | 'desc';
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'recent', label: 'Most Recent', field: 'createdAt', order: 'desc' },
  { value: 'name_asc', label: 'Name (A-Z)', field: 'title', order: 'asc' },
  { value: 'name_desc', label: 'Name (Z-A)', field: 'title', order: 'desc' },
];

interface SortFilterProps {
  label: string;
  selected: string;
  onChange: (selected: string) => void;
}

const SortFilter: React.FC<SortFilterProps> = ({ label, selected, onChange }) => {
  return (
    <div className="mb-8">
      <h3 className="font-medium text-base mb-5 text-neutral-900">{label}</h3>
      <div className="pb-5 border-b border-neutral-200">
        <div className="flex flex-row gap-2 flex-wrap">
          {SORT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-4 cursor-pointer py-2 px-2 rounded transition-colors"
            >
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={selected === option.value}
                onChange={() => onChange(option.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-neutral-700 select-none">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

interface EnhancedFiltersModalProps {
  show: boolean;
  onClose: () => void;
  filters: {
    status: string[];
    location: string[];
    company: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  filterOptions: {
    statuses: string[];
    locations: string[];
    companies: string[];
  };
  onFiltersChange: (filters: {
    status: string[];
    location: string[];
    company: string[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) => void;
  onClearAll: () => void;
  onApply: () => void;
}

const EnhancedFiltersModal: React.FC<EnhancedFiltersModalProps> = ({
  show,
  onClose,
  filters,
  filterOptions,
  onFiltersChange,
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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [show, handleEscapeKey]);

  if (!show) return null;

  const totalSelectedFilters = filters.status.length + filters.location.length + filters.company.length;

  // Get current sort value - find the matching option or default to 'recent'
  const getCurrentSortValue = () => {
    const currentOption = SORT_OPTIONS.find(
      option => option.field === filters.sortBy && option.order === filters.sortOrder
    );
    return currentOption?.value || 'recent';
  };

  // Handle sort change
  const handleSortChange = (sortValue: string) => {
    const selectedOption = SORT_OPTIONS.find(option => option.value === sortValue);
    if (selectedOption) {
      onFiltersChange({
        ...filters,
        sortBy: selectedOption.field,
        sortOrder: selectedOption.order,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-[720px] w-full mx-4 max-h-[800px] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-neutral-900">All Filters</h2>
            {totalSelectedFilters > 0 && (
              <span className="bg-blue-600 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
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
            {/* Sort Filter */}
            <SortFilter
              label="Sort By"
              selected={getCurrentSortValue()}
              onChange={handleSortChange}
            />

            {/* Status Filter */}
            <MultiSelectFilter
              label="Status"
              options={filterOptions.statuses}
              selected={filters.status}
              onChange={(selected) =>
                onFiltersChange({ ...filters, status: selected })
              }
            />

            {/* Location Filter */}
            <MultiSelectFilter
              label="Location"
              options={filterOptions.locations}
              selected={filters.location}
              grid={true}
              onChange={(selected) =>
                onFiltersChange({ ...filters, location: selected })
              }
            />

            {/* Company Filter */}
            <MultiSelectFilter
              label="Company"
              options={filterOptions.companies}
              selected={filters.company}
              grid={true}
              onChange={(selected) =>
                onFiltersChange({ ...filters, company: selected })
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end rounded-b-lg items-center p-6 border-t border-neutral-200 bg-neutral-50">
          <button
            className="px-4 py-2 text-sm text-neutral-500 border border-neutral-500 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            onClick={() => {
              onClearAll();
              onClose();
            }}
            disabled={totalSelectedFilters === 0}
          >
            Clear All
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm cursor-pointer"
            onClick={() => {
              onApply();
              onClose();
            }}
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFiltersModal;