import React, { useState, useEffect, useCallback } from 'react';
import { TiArrowSortedDown } from 'react-icons/ti';

const ExperienceFilter = ({ 
  minExperience,
  maxExperience, 
  onFilterChange,
  onApplyFilterChange,
  onClose,
}: {
  minExperience?: number;
  maxExperience?: number;
  onFilterChange: (filterType: string, value: string) => void;
  onApplyFilterChange: (filterType: string, value: string) => void;
  onClose: () => void;
}) => {
  const [range, setRange] = useState({ min: 0, max: 15 });
  const [isOpen, setIsOpen] = useState(false);

  // Initialize range based on current filter values
  useEffect(() => {
    if (minExperience !== undefined || maxExperience !== undefined) {
      setRange({
        min: minExperience ?? 0,
        max: maxExperience ?? 15
      });
    } else {
      setRange({ min: 0, max: 15 });
    }
  }, [minExperience, maxExperience]);

  const updateFilter = useCallback((newRange: { min: number; max: number }) => {
    setRange(newRange);
    
    // Convert to filter format
    let filterValue: string = "";
    if (newRange.min === 0 && newRange.max === 15) {
      filterValue = ""; // All experience levels
    } else if (newRange.max >= 15) {
      filterValue = `${newRange.min}+`;
    } else {
      filterValue = `${newRange.min}-${newRange.max}`;
    }

    onFilterChange("experience", filterValue);
  }, [onFilterChange]);

  const handleMinChange = (value: number) => {
    const newMin = Math.max(0, Math.min(value, range.max));
    updateFilter({ min: newMin, max: range.max });
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(range.min, Math.min(value, 15));
    updateFilter({ min: range.min, max: newMax });
  };

  const getExperienceLabel = () => {
    if (range.min === 0 && range.max === 15) return "All Experience";
    if (range.max >= 15) return `${range.min}+ years`;
    if (range.min === range.max) return `${range.min} year${range.min !== 1 ? 's' : ''}`;
    return `${range.min}-${range.max} years`;
  };

  const clearFilter = () => {
    updateFilter({ min: 0, max: 15 });
  };

  const handleClose = useCallback(() => {
    onClose();
    // Reset range to initial state
    updateFilter({ min: minExperience ?? 0, max: maxExperience ?? 15 });
    setIsOpen(!isOpen);
  }, [onClose, updateFilter, isOpen, minExperience, maxExperience]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.experience-filter-container')) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Custom CSS for separate sliders */}
      <style jsx>{`
        .slider-min::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
          cursor: pointer;
          height: 20px;
          width: 20px;
          transition: all 0.2s ease;
        }
        
        .slider-min::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.15);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.6);
        }
        
        .slider-min::-moz-range-thumb {
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4);
          cursor: pointer;
          height: 20px;
          width: 20px;
          transition: all 0.2s ease;
        }
        
        .slider-max::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          background: #9333ea;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(147, 51, 234, 0.4);
          cursor: pointer;
          height: 20px;
          width: 20px;
          transition: all 0.2s ease;
        }
        
        .slider-max::-webkit-slider-thumb:hover {
          background: #7c3aed;
          transform: scale(1.15);
          box-shadow: 0 4px 8px rgba(147, 51, 234, 0.6);
        }
        
        .slider-max::-moz-range-thumb {
          background: #9333ea;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(147, 51, 234, 0.4);
          cursor: pointer;
          height: 20px;
          width: 20px;
          transition: all 0.2s ease;
        }
        
        .slider-min, .slider-max {
          -webkit-appearance: none;
          appearance: none;
          outline: none;
        }
        
        .slider-min::-webkit-slider-track {
          background: linear-gradient(to right, #3b82f6 0%, #3b82f6 100%);
          height: 8px;
          border-radius: 4px;
        }
        
        .slider-max::-webkit-slider-track {
          background: linear-gradient(to right, #9333ea 0%, #9333ea 100%);
          height: 8px;
          border-radius: 4px;
        }
      `}</style>
      
      <div className="relative experience-filter-container">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => handleClose()}
          className="w-full min-w-36 bg-transparent text-neutral-600 text-xs font-medium border border-neutral-300 rounded-full px-4 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-neutral-500 transition-colors cursor-pointer text-left"
        >
          {getExperienceLabel()}
        </button>
        <TiArrowSortedDown 
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none transition-transform w-4 h-4 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
        
        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-25 overflow-hidden backdrop-blur-sm">
            <div className="p-6 space-y-3">        
              {/* Separate Range Sliders */}
              <div className="space-y-3">
                {/* Current Range Display */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-700">Range: {range.min} - {range.max} years</span>
                  {(range.min !== 0 || range.max !== 15) && (
                    <button
                      onClick={clearFilter}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100 transition-all duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                {/* Minimum Experience Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-700 font-medium">Minimum Years</label>
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">{range.min}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max={range.max}
                      value={range.min}
                      onChange={(e) => handleMinChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-min"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0</span>
                    <span>{range.max}</span>
                  </div>
                </div>

                {/* Maximum Experience Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-700 font-medium">Maximum Years</label>
                    <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">{range.max}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={range.min}
                      max="15"
                      value={range.max}
                      onChange={(e) => handleMaxChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-max"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{range.min}</span>
                    <span>15+</span>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    onApplyFilterChange("experience", getExperienceLabel());
                    handleClose();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExperienceFilter;