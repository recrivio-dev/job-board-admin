"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoPlus } from "react-icons/go";
import { IoList } from "react-icons/io5";
import { CiFilter } from "react-icons/ci";
import { HiOutlineArrowCircleLeft } from "react-icons/hi";
import {
  selectJobs,
  fetchFilterOptions,
  selectJobPagination,
  selectJobsLoading,
  selectJobsError,
  selectFilterOptions,
  selectFilterOptionsLoading,
  updatePaginationInfo,
  selectJobViewMode,
  selectJobFilters,
  setViewMode,
  clearError,
  applyFilters,
  fetchJobs,
  setPageSize,
} from "@/store/features/jobSlice";
import {
  JobListComponent,
  JobCard,
} from "@/components/Job-card&list-component";
import { FilterState, JobsClientComponentProps } from "@/types/custom";
import {
  JobCardSkeleton,
  EmptyState,
  ErrorState,
  FilterDropdown,
} from "./job_utils";
import Pagination from "@/components/pagination";

// Constants
const INITIAL_PAGE_SIZE = 18;
const SKELETON_COUNT = 6;

export interface JobFilters {
  status?: string;
  location?: string;
  company?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  accessibleOnly?: boolean;
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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
  const collapsed = useAppSelector((state: RootState) => state.ui.sidebar.collapsed);
  // const jobs = useAppSelector(selectJobs);
  const paginatedJobs = useAppSelector(selectJobs);
  const pagination = useAppSelector(selectJobPagination);
  const loading = useAppSelector(selectJobsLoading);
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

  // Validation helper
  const isValidProps = useMemo(() => {
    return Boolean(userRole && userId && organizationId);
  }, [userRole, userId, organizationId]);

  // Initialize data with better error handling
 useEffect(() => {
    const initializeData = async () => {
      if (initState.initialized || !isValidProps || !userRole || !userId || !organizationId) return;

      // Type guard to ensure required values are strings
      if (typeof userRole !== 'string' || typeof userId !== 'string' || typeof organizationId !== 'string') return;

      try {
        setInitState((prev) => ({ ...prev, error: null }));

        // Fetch filter options first (they're cached, so this is efficient)
        await dispatch(fetchFilterOptions({
          userRole: userRole!,
          userId: userId!,
          organizationId: organizationId!,
        })).unwrap();

        // Then fetch jobs
        await dispatch(fetchJobs({
          page: 1,
          limit: pagination.pageSize,
          userRole: userRole!,
          userId: userId!,
          organizationId: organizationId!,
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
  }, [dispatch, userRole, userId, organizationId, initState.initialized, isValidProps]);


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
    debounce(async (filterType: string, value: string) => {
      if (!isValidProps) return;

      try {
        const newFilters = {
          ...filters,
          [filterType]: value || undefined,
        };

        // Remove undefined values
        Object.keys(newFilters).forEach(key => {
          if (newFilters[key as keyof JobFilters] === undefined) {
            delete newFilters[key as keyof JobFilters];
          }
        });

        // Apply filters with server-side filtering
        await dispatch(applyFilters({
          filters: newFilters,
          userRole: userRole!,
          userId: userId!,
          organizationId: organizationId!,
          page: 1, // Reset to first page on filter change
        })).unwrap();

        // Update local dropdown state
        setFilterDropdowns((prev) => ({
          ...prev,
          [filterType]: value,
          isOpen: false,
        }));
      } catch (err) {
        console.error("Failed to apply filter:", err);
      }
    }, 300), // 300ms debounce
    [dispatch, filters, userRole, userId, organizationId, isValidProps]
  );

  const handleRetry = useCallback(async () => {
    if (!isValidProps || !userRole || !userId || !organizationId) return;

    try {
      dispatch(clearError());
      setInitState((prev) => ({ ...prev, error: null }));

      await dispatch(
        fetchJobs({
          page: 1,
          limit: INITIAL_PAGE_SIZE,
          userRole: userRole!,
          userId: userId!,
          organizationId: organizationId!,
        })
      ).unwrap();
    } catch (err) {
      console.log("Retry failed:", err);
    }
  }, [dispatch, userRole, userId, organizationId, isValidProps]);

  // Pagination handlers
  const handlePageChange = useCallback(
  (page: number) => {
    dispatch(fetchJobs({
      page,
      limit: pagination.pageSize,
      filters,
      userRole: userRole!,
      userId: userId!,
      organizationId: organizationId!,
    }));
  },
  [dispatch, pagination.pageSize, filters, userRole, userId, organizationId]
);

// Let's add comprehensive debugging to understand the exact flow

const handlePageSizeChange = useCallback(
  async (pageSize: number) => {
    if (!isValidProps || !userRole || !userId || !organizationId) {
      console.log('Invalid props, returning early');
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
        userRole: userRole!,
        userId: userId!,
        organizationId: organizationId!,
      };
      
      // Step 3: Fetch jobs
      const result = await dispatch(fetchJobs(fetchJobsParams)).unwrap();
      
    } catch (err) {
      console.error("Failed to change page size:", err);
    }
  },
  [dispatch, filters, userRole, userId, organizationId, isValidProps, pagination] // Added pagination to deps
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

  // const handleClearAllFilters = useCallback(() => {
  //   try {
  //     dispatch(setFilters({}));
  //     setFilterDropdowns({
  //       status: "",
  //       location: "",
  //       company: "",
  //       isOpen: false,
  //     });
  //   } catch (err) {
  //     console.log("Failed to clear filters:", err);
  //   }
  // }, [dispatch]);

  // Optimized job transformations - now using paginated jobs
  
  const transformedJobs = useMemo(() => {
    const forCards = paginatedJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company_name: job.company_name ?? "",
      location: job.location ?? "Remote",
      min_salary: job.salary_min ?? 0,
      max_salary: job.salary_max ?? 0,
      company_logo_url: job.company_logo_url || "/demo.png",
    }));

    const forList = paginatedJobs.map((job) => ({
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

    return { forCards, forList };
  }, [paginatedJobs]);

  // Enhanced loading component
  const LoadingView = () => (
    <div
      className={`transition-all duration-300 min-h-full md:pb-0 px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}
    >
      <div className="mt-4 px-2">
        <div className="flex items-center gap-1 mb-2">
          <Link
            href="/dashboard"
            className="flex items-center text-neutral-500 hover:text-neutral-700 font-medium text-base"
          >
            <HiOutlineArrowCircleLeft className="w-6 h-6 mr-1" />
            <p className="text-sm">Back to Dashboard</p>
          </Link>
          <span className="text-sm text-neutral-500 font-light">/</span>
          <span className="text-sm font-medium text-neutral-900">Jobs</span>
        </div>

        <div className="flex items-center justify-between my-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              Manage All Jobs
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Loading your job listings...
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <JobCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
    </div>
  );

  // Show loading state
  if (!initState.initialized || loading) {
    return <LoadingView />;
  }

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
      <div className="mt-4 px-2">
        {/* Header section */}
        <div className="flex items-center gap-1 mb-2">
          <Link
            href="/dashboard"
            className="flex items-center text-neutral-500 hover:text-neutral-700 font-medium text-base transition-colors"
          >
            <HiOutlineArrowCircleLeft className="w-6 h-6 mr-1" />
            <p className="text-sm">Back to Dashboard</p>
          </Link>
          <span className="text-sm text-neutral-500 font-light">/</span>
          <span className="text-sm font-medium text-neutral-900">Jobs</span>
        </div>

        {/* Title and Add Job section */}
        <div className="flex items-center flex-wrap justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              Manage All Jobs
            </h1>
            <p className="text-sm text-neutral-500 mb-2">
              Manage your job listings and applications with ease.
              {pagination.totalCount > 0 && (
                <span className="ml-1 font-medium">
                  ({pagination.totalCount} job{pagination.totalCount !== 1 ? "s" : ""} found)
                </span>
              )}
            </p>
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <button
              type="button"
              onClick={handleAddJob}
              aria-label="Add New Job"
              className="bg-blue-600 w-full sm:w-auto hover:bg-blue-700 text-white font-medium rounded-lg py-2 transition-colors cursor-pointer px-4 flex items-center justify-center md:justify-start gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <GoPlus className="h-6 w-6" />
              Add Job
            </button>
          </div>
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
              className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-3xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
              className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-3xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
            <div className="hidden md:flex items-center gap-2 border-r border-neutral-300 pr-2">
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
                className="flex items-center gap-1 font-medium cursor-pointer bg-neutral-200 px-4 py-2 rounded-3xl hover:bg-neutral-300 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                onClick={() => alert("Advanced filters coming soon!")}
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

              {/* {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label="Clear all filters"
                >
                  Clear all
                </button>
              )} */}
            </div>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : pagination.totalCount === 0 ? (
          <EmptyState onAddJob={handleAddJob} />
        ) : (
          <>
            {viewMode === "board" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transformedJobs.forCards.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <JobListComponent jobsFromStore={transformedJobs.forList} />
            )}

            {/* Pagination */}
            {pagination.totalCount > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalCount}
                itemsPerPage={pagination.pageSize}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handlePageSizeChange}
                showItemsPerPage={true}
                itemsPerPageOptions={[6, 12, 18, 30]}
                className="mt-8"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
