"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { CiFilter, CiSearch } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import {
  fetchJobApplicationsWithAccess,
  updateApplicationStatusWithAccess,
  fetchFilterOptions,
  selectCandidatesLoading,
  selectCandidatesError,
  selectFilters,
  selectUserContext,
  setPageSize,
  setFilters,
  selectPagination,
  setCurrentPage,
  selectFilterOptions,
  CandidateWithApplication,
  deleteCandidateApplication,
  CandidateFilters,
} from "@/store/features/candidatesSlice";
import { TiArrowSortedDown } from "react-icons/ti";
import GlobalStickyTable from "@/components/GlobalStickyTable";
import CandidatesDetailsOverlay from "./candidates-details-overlay";
import Pagination from "./pagination";
import FiltersModal from "./filters-modal";
import TableCustomization, { TableColumn } from "./table-customization";

interface InitializationState {
  initialized: boolean;
  error: string | null;
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debouncedFunction = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };
  
  // Add cleanup method
  debouncedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debouncedFunction;
}

// Types for component props
interface CandidatesListProps {
  showHeader?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  className?: string;
  jobId?: string | null;
  onCandidateClick?: (candidate: CandidateWithApplication) => void;
}

// Error component
function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-red-600 mb-4">
        <svg
          className="w-12 h-12 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-neutral-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "on hold":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
        status
      )}`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
    </span>
  );
}

export default function CandidatesList({
  showHeader = true,
  showFilters = true,
  showSorting = true,
  className = "",
  jobId = null,
  onCandidateClick,
}: CandidatesListProps) {
  const dispatch = useAppDispatch();

  // Redux selectors
  const pagination = useAppSelector(selectPagination);
  const loading = useAppSelector(selectCandidatesLoading);
  const error = useAppSelector(selectCandidatesError);
  const filters = useAppSelector(selectFilters);
  const userContext = useAppSelector(selectUserContext);
  const filterOptions = useAppSelector(selectFilterOptions);
  const candidates = useAppSelector(state => state.candidates.candidates) || [];

  // Local state for overlay
  const [candidatesDetailsOverlay, setCandidatesDetailsOverlay] = useState<{
    candidate: CandidateWithApplication | null;
    show: boolean;
  }>({
    candidate: null,
    show: false,
  });

  // Local state
  const [initState, setInitState] = useState<InitializationState>({
    initialized: false,
    error: null,
  });

  // Filters modal state
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [tempFilters, setTempFilters] = useState<Partial<CandidateFilters>>({});


  // Table customization state
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([
    { key: "id", label: "ID", visible: true },
    { key: "applied_date", label: "Applied Date", visible: true },
    { key: "candidate_name", label: "Candidate Name", visible: true },
    { key: "job_title", label: "Job", visible: true },
    { key: "company_name", label: "Company", visible: true },
    { key: "location", label: "Location", visible: true },
  ]);

  // Refs for cleanup
const debouncedFetchRef = useRef<((newFilters: Record<string, unknown>) => void) & { cancel: () => void } | null>(null);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('candidates-table-columns');
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns);
        setTableColumns(parsedColumns);
      } catch (error) {
        console.error('Failed to parse saved column preferences:', error);
      }
    }
  }, []);    

  useEffect(() => {
    const initializeData = async () => {
      if (initState.initialized || !userContext) return;

      try {
        setInitState((prev) => ({ ...prev, error: null }));

        // Fetch filter options first (they're cached, so this is efficient)
        await dispatch(fetchFilterOptions({
          userContext,
        })).unwrap();

        // Then fetch candidates
        await dispatch(fetchJobApplicationsWithAccess({
          page: 1,
          limit: 50,
          userContext,
          filters: {
            jobId: jobId || undefined, // Ensure jobId is handled correctly
          },
        })).unwrap();

        setInitState({ initialized: true, error: null });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load data";
        console.error("Failed to initialize:", err);
        setInitState({ initialized: true, error: errorMessage });
      }
    };

    initializeData();
  }, [dispatch, userContext, initState.initialized, jobId]);

  // Get current experience range display value
const { minExperience, maxExperience } = filters;

const getCurrentExperienceValue = useCallback(() => {
  if (minExperience === undefined && maxExperience === undefined) {
    return "";
  }
  
  // Find matching range
  if (minExperience === 0 && maxExperience === 2) return "0-2";
  if (minExperience === 3 && maxExperience === 5) return "3-5";
  if (minExperience === 6 && maxExperience === 8) return "6-8";
  if (minExperience === 9 && maxExperience === undefined) return "9+";
  
  return "";
}, [minExperience, maxExperience]);

const getCurrentSortValue = () => {
  const { sortBy, sortOrder } = filters;
  
  if (sortBy === "applied_date" && sortOrder === "desc") return "date_desc";
  if (sortBy === "applied_date" && sortOrder === "asc") return "date_asc";
  if (sortBy === "name" && sortOrder === "asc") return "name_asc";
  if (sortBy === "name" && sortOrder === "desc") return "name_desc";
  
  return "date_desc"; // default
};

  // Create a stable debounced function
const debouncedFetch = useMemo(() => {
  const fetchWithFilters = async (newFilters: Record<string, unknown>) => {
    if (!userContext) {
      console.error("User context not available for filtering");
      return;
    }

    try {
      // Clean filters - remove undefined/null values
      const cleanFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

      await dispatch(fetchJobApplicationsWithAccess({
        filters: cleanFilters,
        userContext,
        page: 1, // Reset to first page when filtering
      })).unwrap();

      // Reset pagination to first page
      dispatch(setCurrentPage(1));
            
    } catch (err) {
      console.error("Failed to apply filter:", err);
    }
  };

  return debounce(fetchWithFilters, 300);
}, [dispatch, userContext]);

  // Store ref for cleanup
  useEffect(() => {
    debouncedFetchRef.current = debouncedFetch;
    return () => {
      if (debouncedFetchRef.current?.cancel) {
        debouncedFetchRef.current.cancel();
      }
    };
  }, [debouncedFetch]);

// Updated filter change handler with multi-select support
const handleFilterChange = useCallback((filterType: string, value: string | string[] | number) => {
  if (!userContext) return;

  let newFilters = { ...filters };

  if (filterType === "sortBy") {
    // Handle sort changes (single select)
    switch (value) {
      case "date_desc":
        newFilters.sortBy = "applied_date";
        newFilters.sortOrder = "desc";
        break;
      case "date_asc":
        newFilters.sortBy = "applied_date";
        newFilters.sortOrder = "asc";
        break;
      case "name_asc":
        newFilters.sortBy = "name";
        newFilters.sortOrder = "asc";
        break;
      case "name_desc":
        newFilters.sortBy = "name";
        newFilters.sortOrder = "desc";
        break;
    }
  } else if (filterType === "experience") {
    // Handle experience min/max values
    console.log("Experience filter change:", value);
    if (value === "" || value === "all") {
      // If empty or "all", clear both min and max experience
      newFilters.minExperience = undefined;
      newFilters.maxExperience = undefined;
    } else if (typeof value === "string") {
      // Parse the value to set min and max experience
      if (value === "9+") {
        // Handle 9+ case specifically
        newFilters.minExperience = 9;
        newFilters.maxExperience = undefined; // No upper limit
      } else if (value.includes("-")) {
        // Handle range cases like "0-2", "3-5", "6-8"
        const [min, max] = value.split("-").map(Number);
        console.log("Parsed experience range:", min, max);
        newFilters.minExperience = isNaN(min) ? undefined : min;
        newFilters.maxExperience = isNaN(max) ? undefined : max;
      } else {
        // Handle any other single number cases
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          newFilters.minExperience = numValue;
          newFilters.maxExperience = numValue;
        }
      }
    }
  }
  else if (filterType === "status" || filterType === "companyName" || filterType === "jobTitle") {
    // Handle multi-select filters - expect array values
    if (value === "" || value === "all") {
      // If "All" is selected, clear the filter
      newFilters[filterType] = undefined;
    } else if (Array.isArray(value)) {
      newFilters[filterType] = value.length > 0 ? value : undefined;
    } else {
      // If single value passed, convert to array
      newFilters[filterType] = value ? [value as string] : undefined;
    }
  } else {
    // Handle other single-select filters
    newFilters = {
      ...newFilters,
      [filterType]: value || undefined,
    };
  }

  // Remove undefined values
  Object.keys(newFilters).forEach(key => {
    if (newFilters[key as keyof typeof newFilters] === undefined) {
      delete newFilters[key as keyof typeof newFilters];
    }
  });

  dispatch(setFilters(newFilters));
  
  // Fetch data with new filters
  dispatch(fetchJobApplicationsWithAccess({
    page: 1,
    limit: pagination.candidatesPerPage,
    filters: newFilters,
    userContext,
  }));
}, [dispatch, filters, userContext, pagination.candidatesPerPage]);

const handleTempFilterChange = useCallback((filterType: string, value: string | string[] | number) => {
  let newTempFilters = { ...tempFilters }; // Use tempFilters instead of filters
  console.log("Temp filter change:", filterType, value, newTempFilters);
        
  if (filterType === "sortBy") {
    // Handle sort changes (single select)
    switch (value) {
      case "date_desc":
        newTempFilters.sortBy = "applied_date";
        newTempFilters.sortOrder = "desc";
        break;
      case "date_asc":
        newTempFilters.sortBy = "applied_date";
        newTempFilters.sortOrder = "asc";
        break;
      case "name_asc":
        newTempFilters.sortBy = "name";
        newTempFilters.sortOrder = "asc";
        break;
      case "name_desc":
        newTempFilters.sortBy = "name";
        newTempFilters.sortOrder = "desc";
        break;
    }
  } else if (filterType === "minExperience" || filterType === "maxExperience") {
    // Handle experience min/max values
    newTempFilters[filterType] = value === "" ? undefined : Number(value);
  }
   else if (filterType === "status" || filterType === "jobTitle" || filterType === "companyName") {

    // Fixed multi-select logic for checkbox filters
    const currentSelected = Array.isArray(newTempFilters[filterType])
      ? [...(newTempFilters[filterType] as string[])]
      : [];
            
    // Handle "All" option (empty string)
    if (value === "" || value === "all") {
      // Clear all selections when "All" is selected
      newTempFilters[filterType] = undefined;
    } else if (typeof value === 'string') {
      // Toggle individual option
      const valueIndex = currentSelected.indexOf(value);
            
      if (valueIndex > -1) {
        // Remove if already selected
        currentSelected.splice(valueIndex, 1);
      } else {
        // Add if not selected
        currentSelected.push(value);
      }
            
      // Update the filter
      newTempFilters[filterType] = currentSelected.length > 0 ? currentSelected : undefined;
    } else if (Array.isArray(value)) {
      // Handle array input directly
      newTempFilters[filterType] = value.length > 0 ? value : undefined;
    }
  } else {
    // Handle other single-select filters
    newTempFilters = {
      ...newTempFilters,
      [filterType]: value || undefined,
    };
  }

  // Clean up undefined values
  Object.keys(newTempFilters).forEach(key => {
    if (newTempFilters[key as keyof typeof newTempFilters] === undefined) {
      delete newTempFilters[key as keyof typeof newTempFilters];
    }
  });

  setTempFilters(newTempFilters); //Update tempFilters state instead of dispatching
}, [tempFilters]); // Depend on tempFilters instead of filters

const handleCloseFiltersModal = useCallback(() => {
  setTempFilters({ ...filters }); // Reset temp filters to current filters
  setShowFiltersModal(false);
}, [filters]);

const handleApplyFilters = useCallback(() => {
  if (!userContext) return;
       
  // Apply the temporary filters to main filters
  dispatch(setFilters(tempFilters));
       
  // Fetch data with the temporary filters
  dispatch(fetchJobApplicationsWithAccess({
    page: 1,
    limit: pagination.candidatesPerPage,
    filters: tempFilters, // Use tempFilters
    userContext,
  }));
   
  handleCloseFiltersModal();
}, [dispatch, tempFilters, userContext, pagination.candidatesPerPage, handleCloseFiltersModal]);

  // Handle status updates 
  const handleStatusUpdate = async (applicationId: string, status: string) => {
    if (!userContext) {
      console.log("User context not available");
      return;
    }

    // Confirm status change
    const confirmed = window.confirm(
      `Are you sure you want to change the status to "${status}"?`
    );
    if (!confirmed) {
      return;
    }

    try {
      await dispatch(
        updateApplicationStatusWithAccess({
          applicationId,
          status,
          userContext,
        })
      ).unwrap();

      // Update the overlay candidate status if it's the same candidate
      if (
        candidatesDetailsOverlay.candidate?.application_id === applicationId
      ) {
        setCandidatesDetailsOverlay((prev) => ({
          ...prev,
          candidate: prev.candidate
            ? {
                ...prev.candidate,
                application_status: status,
              }
            : null,
        }));
      }
    } catch (error) {
      console.log("Failed to update status:", error);
    }
  };

  const handleViewCandidate = useCallback((candidate: CandidateWithApplication) => {
    // Show overlay instead of navigating
    setCandidatesDetailsOverlay({
      candidate,
      show: true,
    });

    if (onCandidateClick) {
      onCandidateClick(candidate);
    }
  }, [onCandidateClick]);

  const handleDeleteCandidate = async (application_id: string) => {
    if (!userContext) {
      alert("User context not available. Please log in again.");
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete the application with ID ${application_id}?`
    );
    if (!confirmed) {
      return;
    }

    try {
      await dispatch(deleteCandidateApplication(application_id)).unwrap();

      // Optionally, close the overlay if it was open for this candidate
      if (
        candidatesDetailsOverlay.candidate?.application_id === application_id
      ) {
        setCandidatesDetailsOverlay({ candidate: null, show: false });
      }
    } catch (error) {
      alert(`Failed to delete candidate: ${error}`);
    }
  };

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const calculateExperience = (candidate: CandidateWithApplication) => {
    if (!candidate.experience || candidate.experience.length === 0) return "0";

    let totalMonths = 0;
    candidate.experience.forEach((exp) => {
      if (exp.start_date) {
        const start = new Date(exp.start_date);
        const end = exp.end_date ? new Date(exp.end_date) : new Date();
        const months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
        totalMonths += months;
      }
    });

    const years = Math.floor(totalMonths / 12);
    return years.toString();
  };

  // Pagination handlers
  const handlePageChange = useCallback(
    (page: number) => {
      if (!userContext) {
        console.error("User context not available for pagination");
        return;
      }
      dispatch(fetchJobApplicationsWithAccess({
        page,
        limit: pagination.candidatesPerPage,
        filters,
        userContext,
      }));
    },
    [dispatch, pagination.candidatesPerPage, filters, userContext]
  );
  
  const handlePageSizeChange = useCallback(
    async (pageSize: number) => {
      if (!userContext) {
        console.error("User context not available for page size change");
        return;
      }
      try {
        // Step 1: Update page size in Redux
        dispatch(setPageSize(pageSize));
        
        // Step 2: Log what we're about to send to fetchJobs
        const fetchJobsParams = {
          page: 1,
          limit: pageSize, // This should be the new pageSize
          filters,
          userContext,
        };
        
        // Step 3: Fetch jobs
        await dispatch(fetchJobApplicationsWithAccess(fetchJobsParams)).unwrap();
        
      } catch (err) {
        console.error("Failed to change page size:", err);
      }
    },
    [dispatch, filters, userContext] // Fixed dependency array
  );

  const generateShortId = useCallback((applicationId: string) => {
    // Generate a shorter, more readable ID from the application ID
    const hash = applicationId.split("-").pop() || applicationId;
    return hash.substring(0, 8);
  }, []);

  // Table customization handlers
  const handleColumnToggle = useCallback((columnKey: string) => {
    const updatedColumns = tableColumns.map(col =>
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    );
    setTableColumns(updatedColumns);
    localStorage.setItem('candidates-table-columns', JSON.stringify(updatedColumns));
  }, [tableColumns]);

  const handleColumnsUpdate = useCallback((updatedColumns: TableColumn[]) => {
    setTableColumns(updatedColumns);
    localStorage.setItem('candidates-table-columns', JSON.stringify(updatedColumns));
  }, []);

  // Modal handlers
  const handleOpenFiltersModal = useCallback(() => {
    setTempFilters({ ...filters }); // Copy current filters to temp
    setShowFiltersModal(true);
  }, [filters]);

const handleClearAllFilters = () => {
  if (!userContext) return;
  
  const clearedFilters = {};
  dispatch(setFilters(clearedFilters));
  dispatch(fetchJobApplicationsWithAccess({
    page: 1,
    limit: pagination.candidatesPerPage,
    filters: clearedFilters,
    userContext,
  }));
  setShowFiltersModal(false);
  // Clear debounced fetch if it exists
  if (debouncedFetchRef.current?.cancel) {
    debouncedFetchRef.current.cancel();
  }
};

  // Table columns for GlobalStickyTable
  const columns = useMemo(() => {
    const allColumns = [
      {
        key: "checkbox",
        header: <input type="checkbox" className="rounded border-neutral-300" />,
        width: "48px",
        render: (candidate: CandidateWithApplication) => (
          <input
            type="checkbox"
            className="rounded border-neutral-300"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${candidate.name}`}
          />
        ),
      },
      {
        key: "id",
        header: "ID",
        render: (candidate: CandidateWithApplication) => (
          <span className="text-sm font-medium text-neutral-900">
            {generateShortId(candidate.application_id)}
          </span>
        ),
      },
      {
        key: "applied_date",
        header: "Applied Date",
        render: (candidate: CandidateWithApplication) => (
          <span className="text-sm text-neutral-900">
            {formatDate(candidate.applied_date)}
          </span>
        ),
      },
      {
        key: "candidate_name",
        header: "Candidate Name",
        render: (candidate: CandidateWithApplication) => (
          <div>
            <div className="text-sm font-medium text-neutral-900">
              {candidate.name}
            </div>
            <div className="text-sm text-neutral-500">
              {candidate.candidate_email}
            </div>
          </div>
        ),
      },
      {
        key: "job_title",
        header: "Job",
        render: (candidate: CandidateWithApplication) => (
          <span className="text-sm text-neutral-900">{candidate.job_title}</span>
        ),
      },
      {
        key: "company_name",
        header: "Company",
        render: (candidate: CandidateWithApplication) => (
          <span className="text-sm text-neutral-900">
            {candidate.company_name || "—"}
          </span>
        ),
      },
      {
        key: "location",
        header: "Location",
        render: (candidate: CandidateWithApplication) => (
          <span className="text-sm text-neutral-900">
            {candidate.address || candidate.job_location || "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "140px",
        className: "text-center",
        render: (candidate: CandidateWithApplication) => (
          <div className="flex justify-center">
            <StatusBadge status={candidate.application_status} />
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        width: "120px",
        render: (candidate: CandidateWithApplication) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewCandidate(candidate);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View
          </button>
        ),
      },
    ];

    // Filter columns based on visibility settings
    return allColumns.filter(column => {
      const columnConfig = tableColumns.find(col => col.key === column.key);
      return columnConfig?.visible !== false;
    });
  }, [tableColumns, generateShortId, formatDate, handleViewCandidate]);

  // Handle error state
  if (error) {
    return (
      <div className={className}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Handle case where user context is not available
  if (!userContext) {
    return (
      <div className={className}>
        <ErrorMessage message="User context not available. Please log in again." />
      </div>
    );
  }

const filtersModalOptions = [
  {
    id: "sortBy",
    label: "Sort By",
    type: "radio" as const,
    options: [
      "name_asc",
      "name_desc", 
      "date_desc",
      "date_asc",
    ],
    selected: getCurrentSortValue(),
    onChange: (value: string) => handleTempFilterChange('sortBy', value),
  },
  {
    id: "status",
    label: "Application Status",
    type: "checkbox" as const,
    options: filterOptions.statuses || [],
    selected: tempFilters.status || [],
    onChange: (option: string) => handleTempFilterChange('status', option),
  },
  {
    id: "jobTitle",     
    label: "Active Jobs",
    type: "checkbox" as const,
    options: filterOptions.jobTitles?.map(j => j.value) || [], // Remove the empty string from here
    selected: tempFilters.jobTitle || [],
    onChange: (option: string) => handleTempFilterChange('jobTitle', option),
  },
];

  return (
    <>
      <div className={`${className} relative`}>
        {/* Header */}
        {showHeader && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">
                  All Candidates
                </h1>
                <p className="text-neutral-600 mt-1">
                  Manage all candidates and their applications with ease.
                </p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Job
              </button>
            </div>
          </div>
        )}

        {/* Filters and Sorting */}
        {(showSorting || showFilters) && (
          <div className="flex z-999 flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            {/* Left side - Sorting */}
            <div className="flex items-center gap-4">
              {showSorting && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-blue-600 text-white text-xs border border-blue-600 rounded-full px-2 py-2 cursor-pointer">
                    <span className="font-medium mr-2">Sort by</span>
                    <div className="relative">
                      <select 
                        value={getCurrentSortValue()}
                        onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                        className="bg-blue-600 text-white text-xs border-none outline-none focus:ring-0 appearance-none pr-4 cursor-pointer hover:underline"
                      >
                        <option
                          value="date_desc"
                          className="bg-white text-neutral-900" 
                        >
                          Newest First
                        </option>
                        <option
                          value="date_asc"
                          className="bg-white text-neutral-900"
                        >
                          Oldest First
                        </option>
                        <option
                          value="name_asc"
                          className="bg-white text-neutral-900"
                        >
                          Name (A-Z)
                        </option>
                        <option
                          value="name_desc"
                          className="bg-white text-neutral-900"
                        >
                          Name (Z-A)
                        </option>
                      </select>
                      <TiArrowSortedDown className="absolute right-0 top-1/2 transform -translate-y-1/2 text-white pointer-events-none" />
                    </div>
                  </div>

                 <MultiSelectDropdown
                    options={filterOptions.statuses?.map((status: string) => ({
                      value: status==="all" ? "all" : status.toLowerCase(),
                      label: status.charAt(0).toUpperCase() + status.slice(1)
                    })) || []}
                    selectedValues={filters.status || []}
                    onChange={(values) => handleFilterChange("status", values)}
                    placeholder="App. Status"
                  />
                </div>
              )}
            </div>

            {/* Right side - Additional filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select 
                    className="bg-transparent text-neutral-600 text-xs font-medium border border-neutral-300 rounded-full px-4 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-neutral-500 transition-colors cursor-pointer appearance-none"
                    value={getCurrentExperienceValue()}
                    onChange={(e) => handleFilterChange("experience", e.target.value)}
                  >
                    <option value="">Years of Exp.</option>
                    <option value="0-2">0-2</option>
                    <option value="3-5">3-5</option>
                    <option value="6-8">6-8</option>
                    <option value="9+">9+</option>
                  </select>
                  <TiArrowSortedDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>

                {
                  !jobId && (
                    <div className="relative z-30">
                     <MultiSelectDropdown
                        options={filterOptions.companies?.map(company => ({
                          value: company.value,
                          label: company.value
                        })) || []}
                        selectedValues={filters.companyName || []}
                        onChange={(values) => handleFilterChange("companyName", values)}
                        placeholder="Company"
                      />
                      </div>
                  )
                }          

                {/* Separator */}
                <div className="h-8 w-px bg-neutral-500" />

                {showFilters && (
                  <>
                    <button 
                      onClick={handleOpenFiltersModal}
                      className="flex items-center gap-2 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-full text-xs font-medium text-neutral-600 transition-colors"
                    >
                      <CiFilter className="w-4 h-4" />
                      All Filters
                    </button>
                    <TableCustomization
                      columns={tableColumns}
                      onColumnToggle={handleColumnToggle}
                      onColumnsUpdate={handleColumnsUpdate}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Table */}
        {!loading && (
          <GlobalStickyTable
            columns={columns}
            data={candidates}
            stickyFirst
            stickyLastTwo
          />
        )}

        {/* Pagination - Only show if not using maxItems limit */}
        {!loading && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalCandidates}
            itemsPerPage={pagination.candidatesPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handlePageSizeChange}
            showItemsPerPage={true}
            itemsPerPageOptions={[10, 20, 50, 100]}
            className="mt-6"
          />
        )}
      </div>

      {/* Candidates Details Overlay */}
      <CandidatesDetailsOverlay
        candidatesDetailsOverlay={candidatesDetailsOverlay}
        setCandidatesDetailsOverlay={setCandidatesDetailsOverlay}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDeleteCandidate}
        calculateExperience={calculateExperience}
      />
      {/* Filters Modal */}
      <FiltersModal
        show={showFiltersModal}
        onClose={handleCloseFiltersModal}
        tempFilter={tempFilters}
        filterOptions={filtersModalOptions}
        onClearAll={handleClearAllFilters}
        onApply={handleApplyFilters}
      />
    </>
  );
}