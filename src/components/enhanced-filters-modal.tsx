import React, { useState, useCallback, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import { FaCheck } from "react-icons/fa6";

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
  formatValue = (val) => val.toString(),
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (newMin: number) => {
    const clampedMin = Math.min(newMin, localValue[1] - step);
    const newValue: [number, number] = [clampedMin, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (newMax: number) => {
    const clampedMax = Math.max(newMax, localValue[0] + step);
    const newValue: [number, number] = [localValue[0], clampedMax];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage1 = ((localValue[0] - min) / (max - min)) * 100;
  const percentage2 = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-base text-gray-900">{label}</h3>
        <span className="text-sm text-gray-600">
          {formatValue(localValue[0])} - {formatValue(localValue[1])}
        </span>
      </div>
      
      <div className="relative mb-6">
        {/* Track */}
        <div className="absolute w-full h-2 bg-gray-200 rounded-full top-1/2 transform -translate-y-1/2"></div>
        
        {/* Active track */}
        <div
          className="absolute h-2 bg-blue-500 rounded-full top-1/2 transform -translate-y-1/2"
          style={{
            left: `${percentage1}%`,
            width: `${percentage2 - percentage1}%`,
          }}
        ></div>
        
        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
          style={{
            background: 'transparent',
          }}
        />
        
        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer"
          style={{
            background: 'transparent',
          }}
        />
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  options,
  selected,
  onChange,
}) => {
  const handleOptionToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="font-medium text-base mb-5 text-gray-900">{label}</h3>
      <div className="flex flex-wrap gap-3 pb-5 border-b border-gray-200">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 cursor-pointer py-1 mb-0 hover:bg-gray-50 rounded px-2 transition-colors"
          >
            <div className="relative w-5 h-5 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => handleOptionToggle(option)}
                className="sr-only"
              />
              <div className={`
                w-5 h-5 border-2 rounded-sm transition-all duration-150 flex items-center justify-center
                ${selected.includes(option)
                  ? 'bg-[#359A57] border-[#359A57]' 
                  : 'border-gray-300 bg-white hover:border-gray-400'
                }
              `}>
                {selected.includes(option) && (
                  <FaCheck className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
            <span className="text-sm text-gray-500 select-none capitalize">
              {option}
            </span>
          </label>
        ))}
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
    jobType: string[];
    salaryRange: [number, number];
    experienceRange: [number, number];
  };
  filterOptions: {
    statuses: string[];
    locations: string[];
    companies: string[];
    jobTypes: string[];
  };
  onFiltersChange: (filters: {
    status: string[];
    location: string[];
    company: string[];
    jobType: string[];
    salaryRange: [number, number];
    experienceRange: [number, number];
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
  const totalSelectedFilters = 
    filters.status.length +
    filters.location.length +
    filters.company.length +
    filters.jobType.length +
    (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200000 ? 1 : 0) +
    (filters.experienceRange[0] > 0 || filters.experienceRange[1] < 20 ? 1 : 0);

  const formatSalary = (value: number) => {
    if (value >= 100000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatExperience = (value: number) => {
    return `${value} year${value !== 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-[720px] w-full mx-4 max-h-[800px] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">All Filters</h2>
            {totalSelectedFilters > 0 && (
              <span className="bg-[#1E5CDC] text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                {totalSelectedFilters} selected
              </span>
            )}
          </div>
          <button
            className="text-gray-900 hover:text-black transition-colors p-1 rounded-full hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close filters modal"
          >
            <RxCross2 className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {/* Status Filter */}
            <MultiSelectFilter
              label="Status"
              options={filterOptions.statuses}
              selected={filters.status}
              onChange={(selected) => onFiltersChange({ ...filters, status: selected })}
            />

            {/* Location Filter */}
            <MultiSelectFilter
              label="Location"
              options={filterOptions.locations}
              selected={filters.location}
              onChange={(selected) => onFiltersChange({ ...filters, location: selected })}
            />

            {/* Company Filter */}
            <MultiSelectFilter
              label="Company"
              options={filterOptions.companies}
              selected={filters.company}
              onChange={(selected) => onFiltersChange({ ...filters, company: selected })}
            />

            {/* Job Type Filter */}
            <MultiSelectFilter
              label="Job Type"
              options={filterOptions.jobTypes}
              selected={filters.jobType}
              onChange={(selected) => onFiltersChange({ ...filters, jobType: selected })}
            />

            {/* Salary Range */}
            <RangeSlider
              label="Salary Range"
              min={0}
              max={200000}
              step={5000}
              value={filters.salaryRange}
              onChange={(value) => onFiltersChange({ ...filters, salaryRange: value })}
              formatValue={formatSalary}
            />

            {/* Experience Range */}
            <RangeSlider
              label="Experience Range"
              min={0}
              max={20}
              step={1}
              value={filters.experienceRange}
              onChange={(value) => onFiltersChange({ ...filters, experienceRange: value })}
              formatValue={formatExperience}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end rounded-b-lg items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            className="px-4 py-2 text-sm text-neutral-500 border border-neutral-500 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFiltersModal; 