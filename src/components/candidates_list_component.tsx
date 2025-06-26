"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { CiFilter } from "react-icons/ci";
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

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
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
  const [sortBy, setSortBy] = useState("recent");

  // Table customization state
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([
    { key: "checkbox", label: "Select", visible: true },
    { key: "id", label: "ID", visible: true },
    { key: "applied_date", label: "Applied Date", visible: true },
    { key: "candidate_name", label: "Candidate Name", visible: true },
    { key: "job_title", label: "Job", visible: true },
    { key: "company_name", label: "Company", visible: true },
    { key: "location", label: "Location", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "actions", label: "Actions", visible: true },
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
        console.log("Fetching job applications with access...");
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

  // Improved sort value getter
const { sortBy: currentSortBy, sortOrder } = filters;

const getCurrentSortValue = useCallback(() => {
  if (!currentSortBy || !sortOrder) {
    return "date_desc"; // default
  }
  
  // Map current sort state back to select value
  if (currentSortBy === 'applied_date' && sortOrder === 'desc') return 'date_desc';
  if (currentSortBy === 'applied_date' && sortOrder === 'asc') return 'date_asc';
  if (currentSortBy === 'name' && sortOrder === 'asc') return 'name_asc';
  if (currentSortBy === 'name' && sortOrder === 'desc') return 'name_desc';
  
  return "date_desc"; // fallback
}, [currentSortBy, sortOrder]);

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

// Improved filter change handler with proper TypeScript
const handleFilterChange = useCallback((filterType: string, value: string) => {
  if (!userContext) return;

  let newFilters = { ...filters };

  if (filterType === "sortBy") {
    // Handle sort changes
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
    // Handle experience filter
    if (value === "0-2") {
      newFilters.minExperience = 0;
      newFilters.maxExperience = 2;
    } else if (value === "3-5") {
      newFilters.minExperience = 3;
      newFilters.maxExperience = 5;
    } else if (value === "6-8") {
      newFilters.minExperience = 6;
      newFilters.maxExperience = 8;
    } else if (value === "9+") {
      newFilters.minExperience = 9;
      newFilters.maxExperience = undefined;
    } else {
      newFilters.minExperience = undefined;
      newFilters.maxExperience = undefined;
    }
  } else {
    // Handle other filters
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

  const handleResetColumns = useCallback(() => {
    const defaultColumns: TableColumn[] = [
      { key: "checkbox", label: "Select", visible: true },
      { key: "id", label: "ID", visible: true },
      { key: "applied_date", label: "Applied Date", visible: true },
      { key: "candidate_name", label: "Candidate Name", visible: true },
      { key: "job_title", label: "Job", visible: true },
      { key: "company_name", label: "Company", visible: true },
      { key: "location", label: "Location", visible: true },
      { key: "status", label: "Status", visible: true },
      { key: "actions", label: "Actions", visible: true },
    ];
    setTableColumns(defaultColumns);
    localStorage.setItem('candidates-table-columns', JSON.stringify(defaultColumns));
  }, []);

  // Modal handlers
  const handleOpenFiltersModal = () => setShowFiltersModal(true);
  const handleCloseFiltersModal = () => setShowFiltersModal(false);
  
  const handleClearAllFilters = () => {
    const clearedFilters = {};
    dispatch(setFilters(clearedFilters));
  };

  const handleApplyFilters = () => {
    handleCloseFiltersModal();
    // Filters are already applied through individual onChange handlers
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

  return (
    <>
      <div className={className}>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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

                  <div className="relative">
                    <select
                      value={filters.status || ""}
                      onChange={(e) => handleFilterChange("status", e.target.value)}
                      className="bg-transparent text-neutral-600 text-xs font-medium border border-neutral-300 rounded-full px-4 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-neutral-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="">App. Status</option>
                      <option value="accepted">Accepted</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <TiArrowSortedDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  </div>
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
                     <div className="relative">
                  <select
                    value={filters.companyName || ""}
                    onChange={(e) => handleFilterChange("companyName", e.target.value)}
                    className="bg-transparent text-neutral-600 text-xs font-medium border border-neutral-300 rounded-full px-4 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-neutral-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">Company</option>
                    {filterOptions.companies?.map((company, index) => (
                      <option key={index} value={company.value}>
                        {company.value}
                      </option>
                    ))}
                  </select>
                  <TiArrowSortedDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
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
                      onResetToDefault={handleResetColumns}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSpinner />}
        
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
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterOptions={[
          {
            id: "status",
            label: "Application Status",
            type: "checkbox" as const,
            options: ["accepted", "pending", "rejected"],
            selected: filters.status ? [filters.status] : [],
            onChange: (option: string) => {
              const isSelected = filters.status === option;
              const newFilters = {
                ...filters,
                status: isSelected ? undefined : option
              };
              dispatch(setFilters(newFilters));
            },
          },
          {
            id: "company",
            label: "Company",
            type: "checkbox" as const,
            options: filterOptions.companies?.map(c => c.value) || [],
            selected: filters.companyName ? [filters.companyName] : [],
            onChange: (option: string) => {
              const isSelected = filters.companyName === option;
              const newFilters = {
                ...filters,
                companyName: isSelected ? undefined : option
              };
              dispatch(setFilters(newFilters));
            },
          },
        ]}
        onClearAll={handleClearAllFilters}
        onApply={handleApplyFilters}
      />
    </>
  );
}