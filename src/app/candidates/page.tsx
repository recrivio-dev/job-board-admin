"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { IoSearchSharp } from "react-icons/io5";
import { HiOutlineArrowCircleLeft } from "react-icons/hi";
import Link from "next/link";
import CandidatesList from "@/components/candidates_list_component";
import { RootState } from "@/store/store";
import {
  fetchJobApplicationsWithAccess,
  setUserContext,
  clearError,
  selectCandidatesError,
  selectCandidatesLoading,
  selectUserContext,
  selectFilters,
  setFilters,
  UserContext,
  CandidateFilters,
} from "@/store/features/candidatesSlice";

import { initializeAuth } from "@/store/features/userSlice";

import { User } from "@supabase/supabase-js";
import { Organization, UserRole } from "@/types/custom";

// Debounce utility function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Loading component for better UX
const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-neutral-600">{message}</span>
  </div>
);

// Error/Info message component
const InfoMessage = ({
  message,
  type = "info",
}: {
  message: string;
  type?: "info" | "error";
}) => (
  <div
    className={`p-4 rounded-lg text-center ${
      type === "error"
        ? "bg-red-50 text-red-700 border border-red-200"
        : "bg-blue-50 text-blue-700 border border-blue-200"
    }`}
  >
    {message}
  </div>
);

// Main Candidates Content Component
const CandidatesContent = ({
  user,
  organization,
  roles,
  collapsed,
}: {
  user: User;
  organization: Organization;
  roles: UserRole[];
  collapsed: boolean;
}) => {
  const dispatch = useAppDispatch();

  // Candidates selectors
  const error = useAppSelector(selectCandidatesError);
  const loading = useAppSelector(selectCandidatesLoading);
  const userContext = useAppSelector(selectUserContext);
  const filters = useAppSelector(selectFilters);

  // Local state for search
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Memoize user context to prevent unnecessary re-renders
  const memoizedUserContext = useMemo((): UserContext | null => {
    console.log("Memoizing user context:", {
      userId: user?.id,
      organizationId: organization?.id,
      roles: roles,
    });

    if (!user?.id || !organization?.id || !roles) {
      return null;
    }

    return {
      userId: user.id,
      organizationId: organization.id,
      roles: roles.map(role => role.role.name).join(', '),
    };
  }, [user?.id, organization?.id, roles]);

  // Set user context when it's available
  useEffect(() => {
    if (memoizedUserContext && !userContext) {
      dispatch(setUserContext(memoizedUserContext));
    }
  }, [memoizedUserContext, userContext, dispatch]);

  // Load candidates when user context is available
  useEffect(() => {
    if (memoizedUserContext) {
      dispatch(
        fetchJobApplicationsWithAccess({
          filters: {}, // You can add default filters here if needed
          userContext: memoizedUserContext,
        })
      );
    }
  }, [dispatch, memoizedUserContext]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      if (!memoizedUserContext) return;

      const newFilters: Partial<CandidateFilters> = {
        ...filters,
        searchTerm: searchValue || undefined,
      };

      // Remove undefined values
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key as keyof CandidateFilters] === undefined) {
          delete newFilters[key as keyof CandidateFilters];
        }
      });

      // Update filters
      dispatch(setFilters(newFilters));

      // Fetch candidates with new search term
      dispatch(
        fetchJobApplicationsWithAccess({
          filters: newFilters,
          userContext: memoizedUserContext,
          page: 1, // Reset to first page on search
        })
      );
    }, 500),
    [dispatch, filters, memoizedUserContext]
  );

  // Search handler that updates local state immediately and triggers debounced search
  const handleSearchChange = useCallback((searchValue: string) => {
    setSearchTerm(searchValue); // Update local state immediately for UI responsiveness
    debouncedSearch(searchValue); // Trigger debounced search
  }, [debouncedSearch]);

  return (
    <div
      className={`transition-all duration-300 h-full px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}
    >
      <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2">
        {/* Back Navigation and Title */}
        <div className="flex items-center gap-1 mb-2">
          <Link
            href="/dashboard"
            className="flex items-center text-neutral-500 hover:text-neutral-700 font-medium text-sm transition-colors"
          >
            <HiOutlineArrowCircleLeft className="w-6 h-6 mr-1" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-sm text-neutral-500 font-light">
            /
          </span>
          <span className="text-sm font-medium text-neutral-900">
            Candidates
          </span>
        </div>

        {/* Header with Role-based Content */}
        <div className="flex items-center flex-wrap justify-between mb-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-neutral-900">
                All Candidates
              </h1>
            </div>

              <p className="text-sm text-neutral-500">
                Manage all candidates and their applications with ease.
              </p>

              {/* Organization and role info */}
              {/* <div className="flex flex-wrap gap-4 text-xs text-neutral-500 mt-1">
                <span>
                  Organization: {organization.name || "Current Organization"}
                </span>
                <span>Role: {primaryRole}</span>
              </div> */}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="w-full md:w-125 mb-8">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <IoSearchSharp className="w-5 h-5 text-neutral-500" />
            </span>
            <input
              type="text"
              placeholder="Search candidates by name, job, company, location, or ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-200 text-neutral-700 text-sm font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              aria-label="Search candidates"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading candidates
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => dispatch(clearError())}
                  className="text-red-800 hover:text-red-900 text-sm underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Candidates List Component */}
        <CandidatesList
          showHeader={false}
          showFilters={true}
          showSorting={true}
        />

        {/* Loading State */}
        {loading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800 text-sm">Loading candidates...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Candidates() {
  const dispatch = useAppDispatch();

  // UI selectors
  const collapsed = useAppSelector((state) => state.ui.sidebar.collapsed);

  // User authentication data
  const user = useAppSelector((state: RootState) => state.user.user);
  const organization = useAppSelector(
    (state: RootState) => state.user.organization
  );
  const roles = useAppSelector((state: RootState) => state.user.roles);
  const isLoading = useAppSelector((state: RootState) => state.user.loading);
  const error = useAppSelector((state: RootState) => state.user.error);

  // Initialize authentication if not already done
  useEffect(() => {
    if (!user && !isLoading) {
      console.log("User not found, initializing auth...");
      console.log("Current user state:", user);
      console.log("Current loading state:", isLoading);
      dispatch(initializeAuth());
    }
  }, [user, isLoading, dispatch]);

  // Handle error state
  if (error) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <InfoMessage
            message={`Authentication error: ${error}`}
            type="error"
          />
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading || !user) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <LoadingSpinner message="Loading user authentication..." />
        </div>
      </div>
    );
  }

  // Handle missing organization
  if (isLoading || !organization) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <InfoMessage
            message="You are not part of any organization. Please contact your administrator."
            type="info"
          />
        </div>
      </div>
    );
  }

  // Handle missing roles with more helpful message
  if (!roles || roles.length === 0) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <InfoMessage
            message="No role is assigned to you. Please contact your administrator to assign a role."
            type="info"
          />
        </div>
      </div>
    );
  }

  // Additional validation for required data
  if (!user.id || !organization.id) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <InfoMessage
            message="Invalid user or organization data. Please try refreshing the page."
            type="error"
          />
        </div>
      </div>
    );
  }

  return (
    <CandidatesContent
      user={user}
      organization={organization}
      roles={roles}
      collapsed={collapsed}
    />
  );
}
