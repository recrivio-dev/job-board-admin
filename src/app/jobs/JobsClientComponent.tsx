"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import { GoPlus } from "react-icons/go";
import { IoList } from "react-icons/io5";
import { CiFilter } from "react-icons/ci";
import { IoSearchSharp } from "react-icons/io5";
import {
  fetchJobs,
  fetchFilterOptions,
  selectJobs,
  selectJobsError,
  selectJobPagination,
  selectJobViewMode,
  selectJobFilters,
  selectFilterOptions,
  selectFilterOptionsLoading,
  setViewMode,
  clearError,
  applyFilters,
  setPageSize,
  setFilters,
  clearJobs,
} from "@/store/features/jobSlice";
import {
  JobListComponent,
  JobCard,
} from "@/components/Job-card&list-component";
import { FilterState, JobsClientComponentProps } from "@/types/custom";
import { EmptyState, ErrorState, FilterDropdown } from "./job_utils";
import Pagination from "@/components/pagination";
import EnhancedFiltersModal from "@/components/enhanced-filters-modal";
import Breadcrumb from "@/components/Breadcrumb";

// Constants
const INITIAL_PAGE_SIZE = 30;

export interface JobFilters {
  status?: string | string[];
  location?: string | string[];
  company?: string | string[];
  jobType?: string | string[];
  experienceLevel?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  experienceRange?: {
    min: number;
    max: number;
  };
  accessibleOnly?: boolean;
}

function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout;
  const debouncedFunction = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debouncedFunction.cancel = () => {
    clearTimeout(timeout);
  };

  return debouncedFunction;
}

interface InitializationState {
  initialized: boolean;
  error: string | null;
}

export default function JobsClientComponent({
  userRole,
  userId,
  organizationId,
}: JobsClientComponentProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  // Redux selectors
  const collapsed = useAppSelector(
    (state: RootState) => state.ui.sidebar.collapsed
  );
  // const jobs = useAppSelector(selectJobs);
  const paginatedJobs = useAppSelector(selectJobs);
  const pagination = useAppSelector(selectJobPagination);
  const error = useAppSelector(selectJobsError);
  const viewMode = useAppSelector(selectJobViewMode);
  const filters = useAppSelector(selectJobFilters);

  // New filter options selectors
  const filterOptions = useAppSelector(selectFilterOptions);
  const filterOptionsLoading = useAppSelector(selectFilterOptionsLoading);

  // Local state
  const [initState, setInitState] = useState<InitializationState>({
    initialized: false,
    error: null,
  });

  const [filterDropdowns, setFilterDropdowns] = useState<FilterState>({
    status: "",
    location: "",
    company: "",
    isOpen: false,
  });

  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Refs to store debounced functions to prevent memory leaks
  const debouncedFilterRef = useRef<
    | (((filterType: string, value: string) => void) & { cancel: () => void })
    | null
  >(null);
  const debouncedSearchRef = useRef<
    (((searchValue: string) => void) & { cancel: () => void }) | null
  >(null);

  // Validation helper
  const isValidProps = useMemo(() => {
    return Boolean(userRole && userId && organizationId);
  }, [userRole, userId, organizationId]);

  // Initialize data when component mounts
  useEffect(() => {
    if (initState.initialized || !isValidProps) return;

    const initializeData = async () => {
      // Type guard to ensure required values are strings
      if (
        typeof userRole !== "string" ||
        typeof userId !== "string" ||
        typeof organizationId !== "string"
      ) {
        return;
      }

      try {
        setInitState((prev) => ({ ...prev, error: null }));

        // Fetch filter options first (they're cached, so this is efficient)
        await dispatch(
          fetchFilterOptions({
            userRole,
            userId,
            organizationId,
          })
        ).unwrap();

        // Then fetch jobs
        await dispatch(
          fetchJobs({
            page: 1,
            limit: pagination.pageSize,
            userRole,
            userId,
            organizationId,
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
    userRole,
    userId,
    organizationId,
    initState.initialized,
    isValidProps,
    pagination.pageSize,
  ]);

  // Initialize debounced functions and store in refs
  useEffect(() => {
    debouncedFilterRef.current = debounce(
      async (filterType: string, value: string) => {
        if (!isValidProps) return;

        try {
          const newFilters = {
            ...filters,
            [filterType]: value || undefined,
          };

          // Remove undefined values
          Object.keys(newFilters).forEach((key) => {
            if (newFilters[key as keyof JobFilters] === undefined) {
              delete newFilters[key as keyof JobFilters];
            }
          });

          // Update filters immediately without loading state
          dispatch(setFilters(newFilters));

          // Update local dropdown state immediately
          setFilterDropdowns((prev) => ({
            ...prev,
            [filterType]: value,
            isOpen: false,
          }));

          // Apply filters with server-side filtering
          await dispatch(
            applyFilters({
              filters: newFilters,
              userRole: userRole || "",
              userId: userId || "",
              organizationId,
              page: 1,
            })
          ).unwrap();
        } catch (err) {
          console.error("Failed to apply filter:", err);
        }
      },
      500
    );

    debouncedSearchRef.current = debounce(async (searchValue: string) => {
      if (!isValidProps) return;

      try {
        const newFilters = {
          ...filters,
          searchTerm: searchValue || undefined,
        };

        // Remove undefined values
        Object.keys(newFilters).forEach((key) => {
          if (newFilters[key as keyof JobFilters] === undefined) {
            delete newFilters[key as keyof JobFilters];
          }
        });

        // Update filters immediately
        dispatch(setFilters(newFilters));

        // Apply filters with server-side filtering
        await dispatch(
          applyFilters({
            filters: newFilters,
            userRole: userRole || "",
            userId: userId || "",
            organizationId,
            page: 1, // Reset to first page on search
          })
        ).unwrap();
      } catch (err) {
        console.error("Failed to apply search:", err);
      }
    }, 500);

    // Cleanup function
    return () => {
      if (debouncedFilterRef.current) {
        debouncedFilterRef.current.cancel?.();
      }
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel?.();
      }
    };
  }, [dispatch, filters, userRole, userId, organizationId, isValidProps]);

  // Cleanup effect to clear data on unmount
  useEffect(() => {
    return () => {
      // Clear jobs data to prevent memory leaks
      dispatch(clearJobs());
      // Cancel any pending debounced functions
      if (debouncedFilterRef.current) {
        debouncedFilterRef.current.cancel?.();
      }
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel?.();
      }
    };
  }, [dispatch]);

  // Optimized handlers with better error handling
  const handleAddJob = useCallback(() => {
    try {
      router.push("/jobs/add-job");
    } catch (err) {
      console.error("Navigation error:", err);
    }
  }, [router]);

  const handleViewModeChange = useCallback(
    (mode: "board" | "list") => {
      try {
        dispatch(setViewMode(mode));
      } catch (err) {
        console.error("Failed to change view mode:", err);
      }
    },
    [dispatch]
  );

  const handleFilterChange = useCallback(
    (filterType: string, value: string) => {
      if (debouncedFilterRef.current) {
        debouncedFilterRef.current(filterType, value);
      }
    },
    []
  );

  // Search handler that updates local state immediately and triggers debounced search
  const handleSearchChange = useCallback((searchValue: string) => {
    setSearchTerm(searchValue); // Update local state immediately for UI responsiveness
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(searchValue);
    }
  }, []);

  const handleRetry = useCallback(async () => {
    if (!isValidProps || !userRole || !userId || !organizationId) return;

    try {
      dispatch(clearError());
      setInitState((prev) => ({ ...prev, error: null }));

      await dispatch(
        fetchJobs({
          page: 1,
          limit: INITIAL_PAGE_SIZE,
          userRole,
          userId,
          organizationId,
        })
      ).unwrap();
    } catch (err) {
      console.log("Retry failed:", err);
    }
  }, [dispatch, userRole, userId, organizationId, isValidProps]);

  // Pagination handlers
  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(
        fetchJobs({
          page,
          limit: pagination.pageSize,
          filters,
          userRole,
          userId,
          organizationId,
        })
      );
    },
    [dispatch, pagination.pageSize, filters, userRole, userId, organizationId]
  );

  // Let's add comprehensive debugging to understand the exact flow

  const handlePageSizeChange = useCallback(
    async (pageSize: number) => {
      if (!isValidProps || !userRole || !userId || !organizationId) {
        console.log("Invalid props, returning early");
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
          userRole,
          userId,
          organizationId,
        };

        // Step 3: Fetch jobs
        await dispatch(fetchJobs(fetchJobsParams)).unwrap();
      } catch (err) {
        console.error("Failed to change page size:", err);
      }
    },
    [dispatch, filters, userRole, userId, organizationId, isValidProps] // Added pagination to deps
  );

  const toggleFilterDropdown = useCallback(
    (filterType: "status" | "location" | "company") => {
      setFilterDropdowns((prev) => ({
        ...prev,
        isOpen: prev.isOpen === filterType ? false : filterType,
      }));
    },
    []
  );

  // Modal handlers
  const handleOpenFiltersModal = () => setShowFiltersModal(true);
  const handleCloseFiltersModal = () => setShowFiltersModal(false);

  const handleClearAllFilters = useCallback(() => {
    const clearedFilters = {};
    dispatch(setFilters(clearedFilters));
    setFilterDropdowns({
      status: "",
      location: "",
      company: "",
      isOpen: false,
    });
    setSearchTerm(""); // Clear search term as well
  }, [dispatch]);

  const handleApplyFilters = useCallback(async () => {
    if (!isValidProps) return;

    // Type guard to ensure required values are strings
    if (typeof userRole !== "string" || typeof userId !== "string") {
      return;
    }

    try {
      const newFilters = {
        ...filters,
        // Convert arrays to single values for API compatibility
        status: Array.isArray(filters.status)
          ? filters.status[0]
          : filters.status,
        location: Array.isArray(filters.location)
          ? filters.location[0]
          : filters.location,
        company: Array.isArray(filters.company)
          ? filters.company[0]
          : filters.company,
        jobType: Array.isArray(filters.jobType)
          ? filters.jobType[0]
          : filters.jobType,
      };

      await dispatch(
        applyFilters({
          filters: newFilters,
          userRole,
          userId,
          organizationId,
          page: 1, // Reset to first page on filter change
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to apply filters:", error);
    }
  }, [dispatch, filters, userRole, userId, organizationId, isValidProps]);

  // Optimized job transformations - now using paginated jobs with search and sorting
  const transformedJobs = useMemo(() => {
    let filteredJobs = [...paginatedJobs];

    // Debug logging for filters
    console.log("Current filters:", filters);
    console.log("Total jobs before filtering:", filteredJobs.length);

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => {
        return (
          // Search in job title
          (job.title && job.title.toLowerCase().includes(searchLower)) ||
          // Search in company name
          (job.company_name &&
            job.company_name.toLowerCase().includes(searchLower)) ||
          // Search in location
          (job.location && job.location.toLowerCase().includes(searchLower)) ||
          // Search in job ID
          (job.id && job.id.toLowerCase().includes(searchLower)) ||
          // Search in job type
          (job.job_type && job.job_type.toLowerCase().includes(searchLower)) ||
          // Search in working type
          (job.working_type &&
            job.working_type.toLowerCase().includes(searchLower)) ||
          // Search in description
          (job.description &&
            job.description.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply client-side multiselect filters - handle both string and array values
    if (filters.status) {
      const statusArray = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      if (statusArray.length > 0) {
        console.log("Applying status filter:", statusArray);
        filteredJobs = filteredJobs.filter((job) =>
          statusArray.includes(job.status || "")
        );
        console.log("Jobs after status filter:", filteredJobs.length);
      }
    }

    if (filters.location) {
      const locationArray = Array.isArray(filters.location)
        ? filters.location
        : [filters.location];
      if (locationArray.length > 0) {
        filteredJobs = filteredJobs.filter((job) =>
          locationArray.includes(job.location || "")
        );
      }
    }

    if (filters.company) {
      const companyArray = Array.isArray(filters.company)
        ? filters.company
        : [filters.company];
      if (companyArray.length > 0) {
        console.log("Applying company filter:", companyArray);
        filteredJobs = filteredJobs.filter((job) =>
          companyArray.includes(job.company_name || "")
        );
        console.log("Jobs after company filter:", filteredJobs.length);
      }
    }

    if (filters.jobType) {
      const jobTypeArray = Array.isArray(filters.jobType)
        ? filters.jobType
        : [filters.jobType];
      if (jobTypeArray.length > 0) {
        console.log("Applying job type filter:", jobTypeArray);
        console.log(
          "Sample job types in data:",
          filteredJobs.slice(0, 3).map((job) => ({
            id: job.id,
            job_type: job.job_type,
            working_type: job.working_type,
          }))
        );
        filteredJobs = filteredJobs.filter(
          (job) =>
            jobTypeArray.includes(job.job_type || "") ||
            jobTypeArray.includes(job.working_type || "")
        );
        console.log("Jobs after job type filter:", filteredJobs.length);
      }
    }

    // Apply salary range filter (check for overlap)
    if (
      filters.salaryRange &&
      (filters.salaryRange.min > 0 || filters.salaryRange.max < 5000000)
    ) {
      filteredJobs = filteredJobs.filter((job) => {
        const jobMinSalary = job.salary_min || 0;
        const jobMaxSalary = job.salary_max || 999999; // Default high value if not set

        // Check for overlap: job range overlaps with filter range
        return (
          jobMinSalary <= filters.salaryRange!.max &&
          jobMaxSalary >= filters.salaryRange!.min
        );
      });
    }

    // Apply experience range filter (check for overlap)
    if (
      filters.experienceRange &&
      (filters.experienceRange.min > 0 || filters.experienceRange.max < 20)
    ) {
      filteredJobs = filteredJobs.filter((job) => {
        const jobMinExp = job.min_experience_needed || 0;
        const jobMaxExp = job.max_experience_needed || 20; // Default high value if not set

        // Check for overlap: job range overlaps with filter range
        return (
          jobMinExp <= filters.experienceRange!.max &&
          jobMaxExp >= filters.experienceRange!.min
        );
      });
    }

    // Apply client-side sorting
    if (sortBy === "az") {
      filteredJobs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "za") {
      filteredJobs.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    } else if (sortBy === "recent") {
      filteredJobs.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Most recent first
      });
    }

    const forCards = filteredJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company_name: job.company_name ?? "",
      location: job.location ?? "Remote",
      min_salary: job.salary_min ?? 0,
      max_salary: job.salary_max ?? 0,
      company_logo_url: job.company_logo_url || "/demo.png",
    }));

    const forList = filteredJobs.map((job) => ({
      job_id: job.id,
      job_title: job.title,
      company_name: job.company_name || "",
      job_location: job.location || "",
      min_salary: job.salary_min || 0,
      max_salary: job.salary_max || 0,
      company_logo_url: job.company_logo_url || "",
      application_deadline: job.application_deadline || "",
      benefits: null,
      job_description: job.description || "",
      job_location_type: job.job_location_type || "",
      job_type: job.job_type || "",
      max_experience_needed: job.max_experience_needed || 0,
      min_experience_needed: job.min_experience_needed || 0,
      requirements: null,
      status: job.status || "",
      updated_at: job.updated_at || "",
      working_type: job.working_type || "",
      admin_id: job.created_by || "",
      created_at: job.created_at || "",
    }));

    console.log("Final filtered jobs count:", filteredJobs.length);
    return { forCards, forList };
  }, [paginatedJobs, sortBy, searchTerm, filters]);

  // Show initialization error
  if (initState.error) {
    return (
      <div
        className={`transition-all duration-300 min-h-full md:pb-0 px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="mt-4 px-2">
          <ErrorState error={initState.error} onRetry={handleRetry} />
        </div>
      </div>
    );
  }

  // Calculate active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div
      className={`transition-all duration-300 min-h-full md:pb-0 px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}
    >
      <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2">
        {/* Header section */}
        <Breadcrumb segments={[{ label: "Jobs" }]} />

        {/* Title section */}
        <div className="mb-9.5">
          <h1 className="text-xl font-semibold text-neutral-900">
            Manage All Jobs
          </h1>
          <p className="text-sm text-neutral-500 mb-2">
            Manage your job listings and applications with ease.
            {transformedJobs.forCards.length > 0 && (
              <span className="ml-1 font-medium">
                ({transformedJobs.forCards.length} job
                {transformedJobs.forCards.length !== 1 ? "s" : ""} found)
              </span>
            )}
          </p>
        </div>

        {/* Global Search Bar and Add Job Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-full md:w-125">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <IoSearchSharp className="w-5 h-5 text-neutral-500" />
              </span>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-200 text-neutral-700 text-sm font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                aria-label="Search jobs"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddJob}
            aria-label="Add New Job"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 transition-colors cursor-pointer px-4 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            <GoPlus className="h-6 w-6" />
            Add Job
          </button>
        </div>

        {/* View mode toggle and filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          {/* View mode toggle */}
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="View mode selection"
          >
            <button
              onClick={() => handleViewModeChange("board")}
              aria-pressed={viewMode === "board"}
              className={`flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-3xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                viewMode === "board"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-neutral-500 text-neutral-500 hover:text-neutral-700 hover:border-neutral-700"
              }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5"
              >
                <path
                  d="M7.16696 1.06244C6.37649 1.26006 5.75356 1.94743 5.64187 2.7422C5.59031 3.12025 5.58602 10.5051 5.63757 10.8617C5.65905 11.0035 5.68912 11.171 5.70631 11.2355L5.73638 11.3557H4.29721C3.41222 11.3557 2.76352 11.3729 2.62605 11.403C1.84417 11.5663 1.19547 12.2321 1.04511 13.0269C0.984964 13.3405 0.984964 21.0132 1.04511 21.3268C1.19547 22.1173 1.84847 22.7875 2.62605 22.9507C2.785 22.9851 4.88576 22.998 9.71451 22.998C17.1381 22.998 16.7944 23.0066 17.2798 22.7746C17.8039 22.5211 18.2722 21.8681 18.3581 21.2581C18.4097 20.8801 18.414 13.4952 18.3624 13.1386C18.341 12.9968 18.3109 12.8293 18.2937 12.7606L18.2636 12.6446H19.7028C20.5878 12.6446 21.2365 12.6274 21.374 12.5973C22.1429 12.4383 22.8088 11.751 22.9549 10.9734C23.015 10.6598 23.015 2.98707 22.9549 2.67346C22.8088 1.88728 22.1515 1.21281 21.374 1.04956C21.026 0.976524 7.45909 0.989412 7.16696 1.06244ZM16.4679 6.82343V11.3557H11.9785C7.65671 11.3557 7.48057 11.3515 7.32591 11.2741C7.23999 11.2312 7.13259 11.1538 7.08963 11.1066C6.89201 10.8875 6.89201 10.9133 6.88772 6.84491C6.88772 4.32743 6.9049 2.94411 6.93068 2.841C6.98653 2.63909 7.14118 2.45436 7.32591 2.36414C7.45479 2.2997 7.91447 2.29111 11.9699 2.29111H16.4679V6.82343ZM21.2236 2.33837C21.3954 2.40281 21.5372 2.54458 21.6274 2.7422C21.7047 2.90545 21.709 3.11165 21.709 6.82343C21.709 10.5352 21.7047 10.7414 21.6274 10.9047C21.5372 11.1023 21.3954 11.2441 21.2236 11.3085C21.1463 11.3386 20.5104 11.3557 19.4278 11.3557H17.7567V6.82343V2.29111H19.4278C20.5104 2.29111 21.1463 2.3083 21.2236 2.33837ZM11.8711 17.1769V21.7092H7.38606C4.3101 21.7092 2.85804 21.6963 2.77641 21.6619C2.60457 21.5975 2.4628 21.4557 2.37258 21.2581C2.29525 21.0949 2.29096 20.8844 2.29096 17.1855C2.29096 12.9625 2.28237 13.1214 2.51865 12.8637C2.72486 12.6403 2.54013 12.6489 7.37317 12.6446H11.8711V17.1769ZM16.7815 12.7863C17.1123 13.0398 17.0908 12.709 17.0908 17.1769C17.0908 21.6448 17.1123 21.314 16.7815 21.5674L16.6268 21.6877L14.8912 21.7006L13.1599 21.7135V17.1769V12.6403L14.8912 12.6532L16.6268 12.666L16.7815 12.7863Z"
                  fill={viewMode === "board" ? "white" : "#606167"}
                />
              </svg>
              Board
            </button>
            <button
              onClick={() => handleViewModeChange("list")}
              aria-pressed={viewMode === "list"}
              className={`flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-3xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-neutral-500 text-neutral-500 hover:text-neutral-700 hover:border-neutral-700"
              }`}
            >
              <IoList className="w-5 h-5" />
              List
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            {/* Sort dropdown */}
            <div className="hidden md:flex items-center gap-2">
              <FilterDropdown
                label="Sort By"
                value={
                  sortBy === "recent"
                    ? "Most Recent"
                    : sortBy === "az"
                    ? "A-Z"
                    : "Z-A"
                }
                options={["Most Recent", "A-Z", "Z-A"]}
                onChange={(value) => {
                  if (value === "Most Recent") setSortBy("recent");
                  else if (value === "A-Z") setSortBy("az");
                  else if (value === "Z-A") setSortBy("za");
                }}
                isOpen={sortDropdownOpen}
                onToggle={() => setSortDropdownOpen(!sortDropdownOpen)}
              />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <FilterDropdown
                label="Job Status"
                value={filterDropdowns.status}
                options={filterOptions.statuses}
                onChange={(value) => handleFilterChange("status", value)}
                isOpen={filterDropdowns.isOpen === "status"}
                onToggle={() => toggleFilterDropdown("status")}
              />
              <FilterDropdown
                label="Location"
                value={filterDropdowns.location}
                options={filterOptions.locations}
                onChange={(value) => handleFilterChange("location", value)}
                isOpen={filterDropdowns.isOpen === "location"}
                onToggle={() => toggleFilterDropdown("location")}
                loading={filterOptionsLoading}
                searchable={filterOptions.locations.length > 10} // Enable search for long lists
                showCount={true}
                placeholder="Job location"
                error={filterOptions.error}
              />
              <FilterDropdown
                label="Company"
                value={filterDropdowns.company}
                options={filterOptions.companies}
                onChange={(value) => handleFilterChange("company", value)}
                isOpen={filterDropdowns.isOpen === "company"}
                onToggle={() => toggleFilterDropdown("company")}
                loading={filterOptionsLoading}
                searchable={filterOptions.companies.length > 10} // Enable search for long lists
                showCount={true}
                placeholder="Company"
                error={filterOptions.error}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1 font-medium cursor-pointer bg-neutral-200 px-4 py-1.5 rounded-3xl hover:bg-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                onClick={handleOpenFiltersModal}
                aria-label="Open advanced filters"
              >
                <CiFilter className="w-5 h-5 text-neutral-500" />
                All Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : transformedJobs.forCards.length === 0 ? (
          <EmptyState onAddJob={handleAddJob} />
        ) : (
          <>
            {viewMode === "board" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {transformedJobs.forCards.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <JobListComponent jobsFromStore={transformedJobs.forList} />
            )}

            {/* Pagination */}
            {transformedJobs.forCards.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={transformedJobs.forCards.length}
                itemsPerPage={pagination.pageSize}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handlePageSizeChange}
                showItemsPerPage={true}
                itemsPerPageOptions={[12, 24, 30, 60]}
                className="mt-8"
              />
            )}
          </>
        )}
      </div>

      {/* Enhanced Filters Modal */}
      <EnhancedFiltersModal
        show={showFiltersModal}
        onClose={handleCloseFiltersModal}
        filters={{
          status: Array.isArray(filters.status)
            ? filters.status
            : filters.status
            ? [filters.status]
            : [],
          location: Array.isArray(filters.location)
            ? filters.location
            : filters.location
            ? [filters.location]
            : [],
          company: Array.isArray(filters.company)
            ? filters.company
            : filters.company
            ? [filters.company]
            : [],
          jobType: Array.isArray(filters.jobType)
            ? filters.jobType
            : filters.jobType
            ? [filters.jobType]
            : [],
          salaryRange: filters.salaryRange
            ? [filters.salaryRange.min, filters.salaryRange.max]
            : [0, 5000000],
          experienceRange: filters.experienceRange
            ? [filters.experienceRange.min, filters.experienceRange.max]
            : [0, 20],
        }}
        filterOptions={{
          statuses: filterOptions.statuses,
          locations: filterOptions.locations,
          companies: filterOptions.companies,
          jobTypes: [
            // Common job types
            "Full-time",
            "Part-time",
            "Contract",
            "Temporary",
            "Internship",
            // Working types from the database
            "Day",
            "Night",
            "Flexible",
          ],
        }}
        onFiltersChange={(newFilters) => {
          // Only update Redux state for client-side filtering
          // This prevents server calls and flickering
          const updatedFilters = {
            ...filters,
            // Keep arrays for multiselect functionality
            status:
              newFilters.status.length === 0 ? undefined : newFilters.status,
            location:
              newFilters.location.length === 0
                ? undefined
                : newFilters.location,
            company:
              newFilters.company.length === 0 ? undefined : newFilters.company,
            jobType:
              newFilters.jobType.length === 0 ? undefined : newFilters.jobType,
            salaryRange:
              newFilters.salaryRange[0] === 0 &&
              newFilters.salaryRange[1] === 5000000
                ? undefined
                : {
                    min: newFilters.salaryRange[0],
                    max: newFilters.salaryRange[1],
                  },
            experienceRange:
              newFilters.experienceRange[0] === 0 &&
              newFilters.experienceRange[1] === 20
                ? undefined
                : {
                    min: newFilters.experienceRange[0],
                    max: newFilters.experienceRange[1],
                  },
          };

          // Only update Redux state - client-side filtering handles the display
          dispatch(setFilters(updatedFilters));
        }}
        onClearAll={handleClearAllFilters}
        onApply={handleApplyFilters}
      />
    </div>
  );
}
