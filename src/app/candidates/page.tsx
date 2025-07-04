"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { IoSearchSharp } from "react-icons/io5";
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
  selectPagination,
  setFilters,
  UserContext,
  CandidateFilters,
} from "@/store/features/candidatesSlice";

import { initializeAuth } from "@/store/features/userSlice";
import { ErrorMessage } from "@/components/errorMessage";

import { User } from "@supabase/supabase-js";
import { Organization, UserRole } from "@/types/custom";
import Breadcrumb from "@/components/Breadcrumb";
import { Suspense } from "react";
import CandidatesSkeleton, {TableSkeleton} from "@/components/CandidatesSkeleton";

// Debounce utility function
function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced as T & { cancel: () => void };
}

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
  const pagination = useAppSelector(selectPagination);

  // Local state for search
  const [searchTerm, setSearchTerm] = useState<string>(filters.searchTerm || "");

  // Memoize user context to prevent unnecessary re-renders
  const memoizedUserContext = useMemo((): UserContext | null => {
    if (!user?.id || !organization?.id || !roles) {
      return null;
    }

    return {
      userId: user.id,
      organizationId: organization.id,
      roles: roles.map((role) => role.role.name).join(", "),
    };
  }, [user?.id, organization?.id, roles]);

  // Set user context when it's available
  useEffect(() => {
    if (memoizedUserContext && !userContext) {
      dispatch(setUserContext(memoizedUserContext));
    }
  }, [memoizedUserContext, userContext, dispatch]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  // Stable debounced search function using useRef
  const debouncedSearchRef = useRef<((searchValue: string) => void) | null>(null);

  // Initialize debounced function only once
  useEffect(() => {
    debouncedSearchRef.current = debounce((searchValue: string) => {
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
          limit: pagination.candidatesPerPage,
        })
      );
    }, 500);

    // The timeout will be automatically cleared when component unmounts
  }, [dispatch, filters, memoizedUserContext, pagination.candidatesPerPage]);

  // Search handler that updates local state immediately and triggers debounced search
  const handleSearchChange = useCallback((searchValue: string) => {
    setSearchTerm(searchValue); // Update local state immediately for UI responsiveness
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(searchValue);
    }
  }, []); // Empty dependency array since we're using ref

  // Memoize the input change handler to prevent unnecessary re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
  }, [handleSearchChange]);

  // Memoize the main container className to prevent recalculation
  const containerClassName = useMemo(() => 
    `transition-all duration-300 h-full px-3 md:px-6 ${
      collapsed ? "md:ml-20" : "md:ml-60"
    } pt-18`,
    [collapsed]
  );

  // Memoize breadcrumb segments to prevent recreation
  const breadcrumbSegments = useMemo(() => [{ label: "Candidates" }], []);

  return (
    <div className={containerClassName}>
      <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2">
        {/* Back Navigation and Title */}
        <Breadcrumb segments={breadcrumbSegments} />

        {/* Header */}
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
              placeholder="Search candidates"
              value={searchTerm}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-200 text-neutral-700 text-sm font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              aria-label="Search candidates"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
         <ErrorMessage
            message={`Error loading candidates: ${error}`}
          />
        )}

        {/* Candidates List Component */}
        <Suspense fallback={<TableSkeleton />}>
          <CandidatesList
            showHeader={false}
            showFilters={true}
            showSorting={true}
          />
        </Suspense>

        {/* Loading State */}
        {loading && (
          <div className="w-full">
            <TableSkeleton/>
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
        <CandidatesSkeleton />
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
