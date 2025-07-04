"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { CiFilter } from "react-icons/ci";
import MultiSelectDropdown from "./multiSelectDropdown";
import ExperienceFilter from "./experienceSlider";
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
  clearCandidates,
  clearFilters,
} from "@/store/features/candidatesSlice";
import { TiArrowSortedDown } from "react-icons/ti";
import GlobalStickyTable from "@/components/GlobalStickyTable";
import CandidatesDetailsOverlay from "./candidates-details-overlay";
import Pagination from "./pagination";
import FiltersModal from "./filters-modal";
import TableCustomization, { TableColumn } from "./table-customization";
import { ErrorMessage } from "./errorMessage";

interface InitializationState {
  initialized: boolean;
  error: string | null;
}

function debounce<T extends (...args: never[]) => unknown>(
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
  const candidates = useAppSelector((state) => state.candidates.candidates);

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
  const [tempFilters, setTempFilters] = useState<Partial<CandidateFilters>>({
    ...filters,
    jobId: jobId || undefined, // Ensure jobId is handled correctly
  });

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
  const debouncedFetchRef = useRef<
    | (((newFilters: Record<string, unknown>) => void) & { cancel: () => void })
    | null
  >(null);

  //memoised filters
  const memoizedFilters = useMemo(() => {
    return {
      ...filters,
      jobId: jobId || undefined,
    };
  }, [filters, jobId]);

  // Update tempFilters when main filters change
  useEffect(() => {
    setTempFilters({
      ...filters,
      jobId: jobId || undefined,
    });
  }, [filters, jobId]);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem("candidates-table-columns");
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns);
        setTableColumns(parsedColumns);
      } catch (error) {
        console.error("Failed to parse saved column preferences:", error);
      }
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      if (initState.initialized || !userContext) return;
      try {
        setInitState((prev) => ({ ...prev, error: null }));

        // Fetch filter options first (they're cached, so this is efficient)
        await dispatch(
          fetchFilterOptions({
            userContext,
          })
        ).unwrap();

        // Then fetch candidates
        await dispatch(
          fetchJobApplicationsWithAccess({
            page: 1,
            limit: pagination.candidatesPerPage,
            userContext,
            filters: {
              ...memoizedFilters,
            },
          })
        ).unwrap();

        setInitState({ initialized: true, error: null });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load data";
        console.error("Failed to initialize:", err);
        setInitState({ initialized: true, error: errorMessage });
      }
    };

    initializeData();
  }, [
    dispatch,
    userContext,
    initState.initialized,
    jobId,
    memoizedFilters,
    pagination.candidatesPerPage,
  ]);

  const getCurrentSortValue = () => {
    const { sortBy, sortOrder } = tempFilters;

    if (sortBy === "applied_date" && sortOrder === "desc") return "date_desc";
    if (sortBy === "applied_date" && sortOrder === "asc") return "date_asc";
    if (sortBy === "name" && sortOrder === "asc") return "name_asc";
    if (sortBy === "name" && sortOrder === "desc") return "name_desc";

    return "date_desc"; // default
  };

  const getCurrentSortValueFilter = () => {
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
        const cleanFilters = Object.entries(newFilters).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, unknown>
        );

        await dispatch(
          fetchJobApplicationsWithAccess({
            filters: cleanFilters,
            userContext,
            page: 1, // Reset to first page when filtering
          })
        ).unwrap();

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

  // Cleanup effect to clear data on unmount
  useEffect(() => {
    return () => {
      // Clear candidates data to prevent memory leaks
      dispatch(clearCandidates());
    };
  }, [dispatch]);

  // Updated filter change handler with multi-select support
  const handleFilterChange = useCallback(
    (filterType: string, value: string | string[] | number) => {
      if (!userContext) return;

      let newFilters = { ...filters };
      if (jobId) {
        newFilters.jobId = jobId; // Ensure jobId is included in filters
      }

      if (filterType === "searchTerm") {
        // For search, load all candidates to search across all data
        newFilters.searchTerm = value as string;
        dispatch(setFilters(newFilters));

        // Load all candidates when searching
        if (value && (value as string).trim() !== "") {
          dispatch(
            fetchJobApplicationsWithAccess({
              filters: newFilters,
              userContext,
              page: 1,
              limit: pagination.candidatesPerPage, // Load a large number to get all candidates for search
            })
          );
        } else {
          // Reset to normal pagination when clearing search
          dispatch(
            fetchJobApplicationsWithAccess({
              filters: newFilters,
              userContext,
              page: 1,
              limit: pagination.candidatesPerPage,
            })
          );
        }
        return;
      }
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
        // Handle experience filter with improved parsing
        if (value === "" || value === "all") {
          newFilters.minExperience = undefined;
          newFilters.maxExperience = undefined;
        } else if (typeof value === "string") {
          if (value.endsWith("+")) {
            // Handle X+ cases (e.g., "9+", "5+")
            const minValue = parseInt(value.replace("+", ""));
            newFilters.minExperience = isNaN(minValue) ? undefined : minValue;
            newFilters.maxExperience = undefined;
          } else if (value.includes("-")) {
            // Handle range cases like "0-2", "3-5", "6-8"
            const [min, max] = value.split("-").map(Number);
            newFilters.minExperience = isNaN(min) ? undefined : min;
            newFilters.maxExperience = isNaN(max) ? undefined : max;
          } else {
            // Handle single number cases
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              newFilters.minExperience = numValue;
              newFilters.maxExperience = numValue;
            }
          }
        }
      } else if (
        filterType === "status" ||
        filterType === "companyName" ||
        filterType === "jobTitle"
      ) {
        // Always set to a new array, even if empty
        if (Array.isArray(value)) {
          newFilters[filterType] = [...value];
        } else if (value === "" || value === "all" || value === null) {
          newFilters[filterType] = [];
        } else {
          newFilters[filterType] = value ? [value as string] : [];
        }
      } else {
        // Handle other single-select filters
        newFilters = {
          ...newFilters,
          [filterType]: value || undefined,
        };
      }

      // Remove undefined values
      Object.keys(newFilters).forEach((key) => {
        if (newFilters[key as keyof typeof newFilters] === undefined) {
          delete newFilters[key as keyof typeof newFilters];
        }
      });

      dispatch(setFilters(newFilters));

      // Fetch data with new filters
      dispatch(
        fetchJobApplicationsWithAccess({
          page: 1,
          limit: pagination.candidatesPerPage,
          filters: newFilters,
          userContext,
        })
      );
    },
    [dispatch, jobId, filters, userContext, pagination.candidatesPerPage]
  );

  const handleTempFilterChange = useCallback(
    (filterType: string, value: string | string[] | number) => {
      let newTempFilters = { ...tempFilters }; // Use tempFilters instead of filters
      if (jobId) {
        newTempFilters.jobId = jobId; // Ensure jobId is included in temp filters
      }
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
      } else if (filterType === "experience") {
        // Handle experience filter with improved parsing
        if (value === "" || value === "all") {
          newTempFilters.minExperience = undefined;
          newTempFilters.maxExperience = undefined;
        } else if (typeof value === "string") {
          if (value.endsWith("+")) {
            // Handle X+ cases (e.g., "9+", "5+")
            const minValue = parseInt(value.replace("+", ""));
            newTempFilters.minExperience = isNaN(minValue)
              ? undefined
              : minValue;
            newTempFilters.maxExperience = undefined;
          } else if (value.includes("-")) {
            // Handle range cases like "0-2", "3-5", "6-8"
            const [min, max] = value.split("-").map(Number);
            newTempFilters.minExperience = isNaN(min) ? undefined : min;
            newTempFilters.maxExperience = isNaN(max) ? undefined : max;
          } else {
            // Handle single number cases
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              newTempFilters.minExperience = numValue;
              newTempFilters.maxExperience = numValue;
            }
          }
        }
      } else if (
        filterType === "status" ||
        filterType === "jobTitle" ||
        filterType === "companyName"
      ) {
        // Fixed multi-select logic for checkbox filters
        const currentSelected = Array.isArray(newTempFilters[filterType])
          ? [...(newTempFilters[filterType] as string[])]
          : [];

        // Handle "All" option (empty string)
        if (value === "" || value === "all" || value === null) {
          // Clear all selections when "All" is selected
          newTempFilters[filterType] = undefined;
        } else if (typeof value === "string") {
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
          newTempFilters[filterType] =
            currentSelected.length > 0 ? currentSelected : undefined;
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
      Object.keys(newTempFilters).forEach((key) => {
        if (newTempFilters[key as keyof typeof newTempFilters] === undefined) {
          delete newTempFilters[key as keyof typeof newTempFilters];
        }
      });

      setTempFilters(newTempFilters); //Update tempFilters state instead of dispatching
    },
    [tempFilters, jobId]
  ); // Depend on tempFilters instead of filters

  const handleCloseFiltersModal = useCallback(() => {
    // Reset temp filters to current filters to ensure proper synchronization
    setTempFilters({
      ...filters,
      jobId: jobId || undefined,
    });
    setShowFiltersModal(false);
  }, [filters, jobId]);

  const handleApplyFilters = useCallback(() => {
    if (!userContext) return;

    // Apply the temporary filters to main filters
    dispatch(setFilters(tempFilters));

    // Fetch data with the temporary filters
    dispatch(
      fetchJobApplicationsWithAccess({
        page: 1,
        limit: pagination.candidatesPerPage,
        filters: tempFilters, // Use tempFilters
        userContext,
      })
    );

    handleCloseFiltersModal();
  }, [
    dispatch,
    tempFilters,
    userContext,
    pagination.candidatesPerPage,
    handleCloseFiltersModal,
  ]);

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

  const handleViewCandidate = useCallback(
    (candidate: CandidateWithApplication) => {
      // Show overlay instead of navigating
      setCandidatesDetailsOverlay({
        candidate,
        show: true,
      });

      if (onCandidateClick) {
        onCandidateClick(candidate);
      }
    },
    [onCandidateClick]
  );

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
      dispatch(
        fetchJobApplicationsWithAccess({
          page,
          limit: pagination.candidatesPerPage,
          filters,
          userContext,
        })
      );
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
        await dispatch(
          fetchJobApplicationsWithAccess(fetchJobsParams)
        ).unwrap();
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
  const handleColumnToggle = useCallback(
    (columnKey: string) => {
      const updatedColumns = tableColumns.map((col) =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      );
      setTableColumns(updatedColumns);
      localStorage.setItem(
        "candidates-table-columns",
        JSON.stringify(updatedColumns)
      );
    },
    [tableColumns]
  );

  const handleColumnsUpdate = useCallback((updatedColumns: TableColumn[]) => {
    setTableColumns(updatedColumns);
    localStorage.setItem(
      "candidates-table-columns",
      JSON.stringify(updatedColumns)
    );
  }, []);

  // Modal handlers
  const handleOpenFiltersModal = useCallback(() => {
    // Copy current filters to temp filters to ensure proper synchronization
    setTempFilters({
      ...filters,
      jobId: jobId || undefined,
    });
    setShowFiltersModal(true);
  }, [filters, jobId]);

  const handleClearAllFilters = () => {
    if (!userContext) return;

    // Use the clearFilters action to properly reset all filters
    dispatch(clearFilters());

    // Force a complete reset of temp filters
    const clearedTempFilters: Partial<CandidateFilters> = {
      status: undefined,
      candidateName: undefined,
      companyName: undefined,
      jobTitle: undefined,
      minExperience: undefined,
      maxExperience: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      jobId: jobId || undefined,
      sortBy: "applied_date",
      sortOrder: "desc",
      searchTerm: undefined,
    };

    setTempFilters(clearedTempFilters);

    // Fetch data with cleared filters
    dispatch(
      fetchJobApplicationsWithAccess({
        page: 1,
        limit: pagination.candidatesPerPage,
        filters: {},
        userContext,
      })
    );
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
        header: (
          <input type="checkbox" className="rounded border-neutral-300" />
        ),
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
          <span className="text-sm text-neutral-900">
            {candidate.job_title}
          </span>
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
    return allColumns.filter((column) => {
      const columnConfig = tableColumns.find((col) => col.key === column.key);
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
      options: ["name_asc", "name_desc", "date_desc", "date_asc"],
      selected: getCurrentSortValue(),
      onChange: (value: string) => handleTempFilterChange("sortBy", value),
    },
    {
      id: "status",
      label: "Application Status",
      type: "checkbox" as const,
      options:
        filterOptions.statuses?.map((status) => status.toLowerCase()) || [],
      selected: Array.isArray(tempFilters.status) ? tempFilters.status : [],
      onChange: (option: string) => {
        handleTempFilterChange("status", option);
      },
    },
    {
      id: "jobTitle",
      label: "Active Jobs",
      type: "checkbox" as const,
      options: filterOptions.jobTitles?.map((j) => j.value) || [],
      selected: Array.isArray(tempFilters.jobTitle) ? tempFilters.jobTitle : [],
      onChange: (option: string) => handleTempFilterChange("jobTitle", option),
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
                        value={getCurrentSortValueFilter()}
                        onChange={(e) =>
                          handleFilterChange("sortBy", e.target.value)
                        }
                        className="bg-blue-600 px-2 text-white text-xs border-none outline-none focus:ring-0 appearance-none pr-4 cursor-pointer hover:underline rounded-md"
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
                    key={filters.status ? filters.status.join(",") : "none"}
                    options={
                      filterOptions.statuses?.map((status: string) => ({
                        value: status.toLowerCase(),
                        label:
                          status.charAt(0).toUpperCase() +
                          status.slice(1).toLowerCase(),
                      })) || []
                    }
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
                <ExperienceFilter
                  minExperience={filters.minExperience}
                  maxExperience={filters.maxExperience}
                  onApplyFilterChange={handleFilterChange}
                  // onClose={handleCloseExperienceFilter}
                />
                {!jobId && (
                  <div className="relative z-30">
                    <MultiSelectDropdown
                      options={
                        filterOptions.companies?.map((company) => ({
                          value: company.value,
                          label: company.label,
                        })) || []
                      }
                      selectedValues={filters.companyName || []}
                      onChange={(values) =>
                        handleFilterChange("companyName", values)
                      }
                      placeholder="Company"
                    />
                  </div>
                )}

                {/* Separator */}
                <div className="h-8 w-px bg-neutral-500" />

                {showFilters && (
                  <>
                    {!jobId && (
                      <button
                        onClick={handleOpenFiltersModal}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-full text-xs font-medium text-neutral-600 transition-colors"
                      >
                        <CiFilter className="w-4 h-4" />
                        All Filters
                      </button>
                    )}
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
        key={`filters-modal-${JSON.stringify(tempFilters)}`}
        show={showFiltersModal}
        onClose={handleCloseFiltersModal}
        filterOptions={filtersModalOptions}
        onClearAll={handleClearAllFilters}
        onApply={handleApplyFilters}
      />
    </>
  );
}
