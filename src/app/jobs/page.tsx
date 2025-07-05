"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import JobsClientComponent from "./JobsClientComponent";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/store";
import { initializeAuth } from "@/store/features/userSlice";

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

export default function JobsPage() {
  const user = useAppSelector((state: RootState) => state.user.user);
  const organization = useAppSelector(
    (state: RootState) => state.user.organization
  );
  const roles = useAppSelector((state: RootState) => state.user.roles);
  const isLoading = useAppSelector((state: RootState) => state.user.loading);
  const error = useAppSelector((state: RootState) => state.user.error);

  // UI selectors
  const collapsed = useAppSelector((state) => state.ui.sidebar.collapsed);

  const dispatch = useAppDispatch();

  // Ref to track if auth initialization has been attempted
  const authInitialized = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize auth only once and only if user is truly not authenticated
  useEffect(() => {
    if (
      authInitialized.current ||
      isLoading ||
      user ||
      error ||
      !mountedRef.current
    ) {
      return;
    }

    console.log("Initializing auth for the first time...");
    authInitialized.current = true;
    dispatch(initializeAuth());
  }, [dispatch, user, isLoading, error]);

  // Reset auth initialization flag when user logs out
  useEffect(() => {
    if (error && authInitialized.current) {
      console.log("User error detected, resetting auth initialization flag");
      authInitialized.current = false;
    }
  }, [error]);

  // Handle error state
  if (error) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Authentication Error</h3>
            <p className="text-red-700 mt-2">{error}</p>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading only during initial auth check
  if (isLoading && !authInitialized.current) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4 mt-10">
          <LoadingSpinner message="Loading user authentication..." />
        </div>
      </div>
    );
  }

  // If no user after auth initialization, redirect to login
  if (!user && authInitialized.current && !isLoading) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4 mt-10">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-yellow-800 font-medium">
              Authentication Required
            </h3>
            <p className="text-yellow-700 mt-2">
              Please log in to access jobs.
            </p>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle missing organization
  if (!organization) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2 mt-10">
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
        className={`transition-all duration-300 h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2 mt-10">
          <InfoMessage
            message="No role is assigned to you. Please contact your administrator to assign a role."
            type="info"
          />
        </div>
      </div>
    );
  }

  // Get the primary role (first role) with fallback
  const primaryRole = roles[0]?.role?.name || "Unknown";

  // Additional validation for required data
  if (!user || !user.id || !organization.id) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-4`}
      >
        <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2 mt-10">
          <InfoMessage
            message="Invalid user or organization data. Please try refreshing the page."
            type="error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl">
      <JobsClientComponent
        userId={user.id}
        userRole={primaryRole}
        organizationId={organization.id}
      />
    </div>
  );
}
