"use client";

import { useMemo, useEffect, useRef, useState, memo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { CiFilter } from "react-icons/ci";
import {
  fetchJobApplicationsWithAccess,
  updateApplicationStatusWithAccess,
  setFilters,
  setSortBy,
  selectCandidatesLoading,
  selectCandidatesError,
  selectFilters,
  selectSortBy,
  selectUserContext,
  selectFilteredCandidatesWithAccess,
  CandidateWithApplication,
  SortOption,
  CandidateFilters,
} from "@/store/features/candidatesSlice";
import type { AppDispatch } from "@/store/store";
import { TiArrowSortedDown } from "react-icons/ti";
import GlobalStickyTable from "@/components/GlobalStickyTable";
import CandidatesDetailsOverlay from "./candidates-details-overlay"; // Import the overlay component

// Types for component props
interface CandidatesListProps {
  showHeader?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  maxItems?: number;
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
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 mb-4">{message}</p>
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
        return "bg-gray-100 text-gray-800 border-gray-200";
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

// Memoize the filter select component
const FilterSelect = memo(
  ({
    value,
    onChange,
    options,
    placeholder,
    className = "",
  }: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
    className?: string;
  }) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-transparent text-gray-600 text-sm border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-gray-400 transition-colors cursor-pointer appearance-none ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <TiArrowSortedDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
);

FilterSelect.displayName = "FilterSelect";

// Memoize the filters section component
const FiltersSection = memo(
  ({
    filters,
    filteredCandidates,
    dispatch,
  }: {
    filters: CandidateFilters;
    filteredCandidates: CandidateWithApplication[];
    dispatch: AppDispatch;
  }) => {
    const companyOptions = useMemo(
      () =>
        Array.from(
          new Set(filteredCandidates.map((c) => c.company_name).filter(Boolean))
        ),
      [filteredCandidates]
    );

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FilterSelect
            value={filters.company ?? ""}
            onChange={(value) =>
              dispatch(setFilters({ ...filters, company: value }))
            }
            options={companyOptions.filter(
              (option): option is string => option !== null
            )}
            placeholder="Company"
          />

          <FilterSelect
            value=""
            onChange={() => {}}
            options={["0-2", "3-5", "5+"]}
            placeholder="Years of Exp."
          />
        </div>
      </div>
    );
  }
);

FiltersSection.displayName = "FiltersSection";

export default function CandidatesList({
  showHeader = true,
  showFilters = true,
  showSorting = true,
  maxItems,
  className = "",
  jobId,
  onCandidateClick,
}: CandidatesListProps) {
  const dispatch = useAppDispatch();

  // Redux selectors
  const filteredCandidates = useAppSelector(selectFilteredCandidatesWithAccess);
  const loading = useAppSelector(selectCandidatesLoading);
  const error = useAppSelector(selectCandidatesError);
  const filters = useAppSelector(selectFilters);
  const sortBy = useAppSelector(selectSortBy);
  const userContext = useAppSelector(selectUserContext);

  // Local state for overlay
  const [candidatesDetailsOverlay, setCandidatesDetailsOverlay] = useState<{
    candidate: CandidateWithApplication | null;
    show: boolean;
  }>({
    candidate: null,
    show: false,
  });

  // Get candidates to display with jobId filtering
  const candidatesToDisplay = useMemo(() => {
    let candidatesSource = filteredCandidates;
    if (jobId) {
      candidatesSource = candidatesSource.filter((c) => c.job_id === jobId);
    }
    if (maxItems && maxItems > 0) {
      return candidatesSource.slice(0, maxItems);
    }
    return candidatesSource;
  }, [filteredCandidates, jobId, maxItems]);

  // Prevent infinite fetch loop
  const hasFetched = useRef(false);

  useEffect(() => {
    if (
      userContext &&
      !loading &&
      !hasFetched.current &&
      candidatesToDisplay.length === 0 &&
      !error
    ) {
      hasFetched.current = true;
      dispatch(
        fetchJobApplicationsWithAccess({
          filters,
          userContext: userContext,
        })
      );
    }
  }, [
    userContext,
    loading,
    candidatesToDisplay.length,
    error,
    dispatch,
    filters,
  ]);

  // Handlers
  const handleStatusUpdate = async (applicationId: string, status: string) => {
    if (!userContext) {
      console.log("User context not available");
      return;
    }

    //confirm status change
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

  const handleViewCandidate = (candidate: CandidateWithApplication) => {
    // Show overlay instead of navigating
    setCandidatesDetailsOverlay({
      candidate,
      show: true,
    });

    if (onCandidateClick) {
      onCandidateClick(candidate);
    }
  };

  // const handleDeleteCandidate = async (applicationId: string) => {
  //   if (!userContext) {
  //     console.log("User context not available");
  //     return;
  //   }

  //   try {
  //     // TODO: Implement delete functionality in the slice
  //     console.log("Delete candidate with application ID:", applicationId);

  //     // Close overlay if the deleted candidate is currently shown
  //     if (candidatesDetailsOverlay.candidate?.application_id === applicationId) {
  //       setCandidatesDetailsOverlay({
  //         candidate: null,
  //         show: false,
  //       });
  //     }
  //   } catch (error) {
  //     console.log("Failed to delete candidate:", error);
  //   }
  // };

  // const handleRowClick = (candidate: CandidateWithApplication) => {
  //   // Allow clicking anywhere on the row to open overlay
  //   handleViewCandidate(candidate);
  // };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  const generateShortId = (applicationId: string) => {
    // Generate a shorter, more readable ID from the application ID
    const hash = applicationId.split("-").pop() || applicationId;
    return hash.substring(0, 8);
  };

  // Table columns for GlobalStickyTable
  const columns = [
    {
      key: "checkbox",
      header: <input type="checkbox" className="rounded border-gray-300" />,
      width: "48px",
      render: (candidate: CandidateWithApplication) => (
        <input
          type="checkbox"
          className="rounded border-gray-300"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${candidate.name}`}
        />
      ),
    },
    {
      key: "id",
      header: "ID",
      render: (candidate: CandidateWithApplication) => (
        <span className="text-sm font-medium text-gray-900">
          {generateShortId(candidate.application_id)}
        </span>
      ),
    },
    {
      key: "applied_date",
      header: "Applied Date",
      render: (candidate: CandidateWithApplication) => (
        <span className="text-sm text-gray-900">
          {formatDate(candidate.applied_date)}
        </span>
      ),
    },
    {
      key: "candidate_name",
      header: "Candidate Name",
      render: (candidate: CandidateWithApplication) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {candidate.name}
          </div>
          <div className="text-sm text-gray-500">
            {candidate.candidate_email}
          </div>
        </div>
      ),
    },
    {
      key: "job_title",
      header: "Job",
      render: (candidate: CandidateWithApplication) => (
        <span className="text-sm text-gray-900">{candidate.job_title}</span>
      ),
    },
    {
      key: "company_name",
      header: "Company",
      render: (candidate: CandidateWithApplication) => (
        <span className="text-sm text-gray-900">
          {candidate.company_name || "—"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (candidate: CandidateWithApplication) => (
        <span className="text-sm text-gray-900">
          {candidate.address || candidate.job_location || "—"}
        </span>
      ),
    },
    {
      key: "years_of_exp",
      header: "Years of Exp.",
      render: (candidate: CandidateWithApplication) => (
        <span className="text-sm text-gray-900">
          {calculateExperience(candidate)}
        </span>
      ),
    },
    {
      key: "app_status",
      header: "App. Status",
      width: "140px",
      className: "text-center",
      render: (candidate: CandidateWithApplication) => (
        <div className="flex justify-center">
          <StatusBadge status={candidate.application_status} />
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
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
                <h1 className="text-2xl font-bold text-gray-900">
                  All Candidates
                </h1>
                <p className="text-gray-600 mt-1">
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
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        dispatch(setSortBy(e.target.value as SortOption))
                      }
                      className="bg-blue-600 text-white text-sm border border-blue-600 rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:bg-blue-700 transition-colors cursor-pointer appearance-none"
                    >
                      <option
                        value="date_desc"
                        className="bg-white text-gray-900"
                      >
                        Newest First
                      </option>
                      <option
                        value="date_asc"
                        className="bg-white text-gray-900"
                      >
                        Oldest First
                      </option>
                      <option
                        value="name_asc"
                        className="bg-white text-gray-900"
                      >
                        Name (A-Z)
                      </option>
                      <option
                        value="name_desc"
                        className="bg-white text-gray-900"
                      >
                        Name (Z-A)
                      </option>
                    </select>
                    <TiArrowSortedDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        dispatch(
                          setFilters({
                            ...filters,
                            status: e.target.value as
                              | "accepted"
                              | "rejected"
                              | "pending"
                              | "on hold"
                              | "All",
                          })
                        )
                      }
                      className="bg-transparent text-gray-600 text-sm border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-gray-400 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="All">App. Status</option>
                      <option value="accepted">Accepted</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                      <option value="on hold">On Hold</option>
                    </select>
                    <TiArrowSortedDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Additional filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select className="bg-transparent text-gray-600 text-sm border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-gray-400 transition-colors cursor-pointer appearance-none">
                    <option>Years of Exp.</option>
                    <option>0-2</option>
                    <option>3-5</option>
                    <option>5+</option>
                  </select>
                  <TiArrowSortedDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filters.company ?? ""}
                    onChange={(e) =>
                      dispatch(
                        setFilters({ ...filters, company: e.target.value })
                      )
                    }
                    className="bg-transparent text-gray-600 text-sm border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-gray-400 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">Company</option>
                    {Array.from(
                      new Set(
                        filteredCandidates
                          .map((c) => c.company_name)
                          .filter(Boolean)
                      )
                    ).map((company) => (
                      <option key={company} value={company ?? ""}>
                        {company}
                      </option>
                    ))}
                  </select>
                  <TiArrowSortedDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {showFilters && (
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full border border-gray-300 text-sm text-gray-600 transition-colors">
                  <CiFilter className="w-4 h-4" />
                  All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Table */}
        {!loading && (
          <GlobalStickyTable
            columns={columns}
            data={candidatesToDisplay}
            stickyFirst
            stickyLastTwo
          />
        )}
      </div>

      {/* Candidates Details Overlay */}
      <CandidatesDetailsOverlay
        candidatesDetailsOverlay={candidatesDetailsOverlay}
        setCandidatesDetailsOverlay={setCandidatesDetailsOverlay}
        onStatusUpdate={handleStatusUpdate}
        // onDelete={handleDeleteCandidate}
        calculateExperience={calculateExperience}
      />
    </>
  );
}
