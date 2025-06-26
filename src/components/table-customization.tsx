import React, { useState, useRef, useEffect } from 'react';
import { BiCheck, BiColumns } from 'react-icons/bi';
import { FiSettings, FiEye, FiEyeOff } from 'react-icons/fi';

export interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
}

interface TableCustomizationProps {
  columns: TableColumn[];
  onColumnToggle: (columnKey: string) => void;
  onResetToDefault?: () => void;
}

const TableCustomization: React.FC<TableCustomizationProps> = ({
  columns,
  onColumnToggle,
  onResetToDefault,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (columnKey: string) => {
    onColumnToggle(columnKey);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Customize table columns"
      >
        <BiColumns className="w-4 h-4" />
        <span className="hidden sm:inline">Columns</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {visibleCount}/{totalCount}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiSettings className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Table Columns</span>
              </div>
              {onResetToDefault && (
                <button
                  onClick={onResetToDefault}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Show or hide table columns
            </p>
          </div>

          {/* Column List */}
          <div className="max-h-64 overflow-y-auto">
            {columns.map((column) => (
              <label
                key={column.key}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={() => handleToggle(column.key)}
                    className="sr-only"
                  />
                  <div className={`
                    w-5 h-5 border-2 rounded transition-all duration-200
                    ${column.visible 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300'
                    }
                  `}>
                    {column.visible && (
                      <BiCheck className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  {column.visible ? (
                    <FiEye className="w-4 h-4 text-gray-400" />
                  ) : (
                    <FiEyeOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm ${
                    column.visible ? 'font-medium text-gray-900' : 'text-gray-600'
                  }`}>
                    {column.label}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-center text-xs text-gray-600">
              <span>Visible: {visibleCount} of {totalCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableCustomization; 