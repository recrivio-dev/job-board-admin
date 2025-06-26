import React, { useState, useRef, useEffect } from 'react';
import { BiCheck } from 'react-icons/bi';
import { MdAddCircleOutline } from "react-icons/md";
import { FiSearch, FiX } from 'react-icons/fi';

export interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
}

interface TableCustomizationProps {
  columns: TableColumn[];
  onColumnToggle: (columnKey: string) => void;
  onColumnsUpdate?: (columns: TableColumn[]) => void; // Optional for batch updates
}

const TableCustomization: React.FC<TableCustomizationProps> = ({
  columns,
  onColumnToggle,
  onColumnsUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempColumns, setTempColumns] = useState<TableColumn[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize temp columns when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempColumns([...columns]);
    }
  }, [isOpen, columns]);

  // Filter columns based on search term
  const filteredColumns = tempColumns.filter(column =>
    column.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleToggle = (columnKey: string) => {
    setTempColumns(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible: !col.visible }
          : col
      )
    );
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm(''); // Clear search when closing
    setTempColumns([]); // Reset temp columns
  };

  const handleCancel = () => {
    handleClose();
  };

  const handleAdd = () => {
    // If onColumnsUpdate is provided, use it to batch update all columns
    if (onColumnsUpdate) {
      onColumnsUpdate(tempColumns);
    } else {
      // Fallback: Apply changes sequentially (less efficient but maintains compatibility)
      const changedColumns = tempColumns.filter(tempCol => {
        const originalCol = columns.find(col => col.key === tempCol.key);
        return originalCol && originalCol.visible !== tempCol.visible;
      });
      
      // Apply changes one by one
      changedColumns.forEach(changedCol => {
        onColumnToggle(changedCol.key);
      });
    }
    handleClose();
  };

  const clearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex item-center text-neutral-700 rounded-full hover:text-neutral-900 transition-colors focus:outline-none cursor-pointer"
        aria-label="Customize table columns"
      >
        <MdAddCircleOutline className='w-8 h-8'/>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">Add Column</span>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 bg-[#E5E6E8] border-0 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <FiX className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Column List */}
          <div className="max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {filteredColumns.length > 0 ? (
              filteredColumns.map((column) => (
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
                        ? 'bg-[#359A57] border-[#359A57] hover:border-[#2a7c45]'
                        : 'border-gray-300'
                      }
                    `}>
                      {column.visible && (
                        <BiCheck className="w-4 h-4 text-white absolute" />
                      )}
                    </div>
                  </div>
                                
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`text-sm ${
                      column.visible ? 'font-medium text-gray-900' : 'text-gray-600'
                    }`}>
                      {column.label}
                    </span>
                  </div>
                </label>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No columns found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>

          {/* Footer with Action Buttons */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm text-white font-medium bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableCustomization;