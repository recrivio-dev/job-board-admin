"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { TiDocumentDelete } from "react-icons/ti";
import { BsBriefcase } from "react-icons/bs";
import { FaCaretDown } from "react-icons/fa";
import { GoPeople } from "react-icons/go";
import Link from "next/link";
import { AppDispatch, RootState } from "@/store/store"; // Adjust path as needed
import { useAppSelector } from "@/store/hooks";

// Import selectors and actions
import {
  fetchDashboardData,
  selectDashboardData,
  selectDashboardStats,
  selectDashboardChartData,
  selectDashboardLoading,
  selectDashboardError,
  selectUserRole,
  clearError,
} from "@/store/features/dashboardSlice"; // Adjust path as needed

import {
  initializeAuth,
} from "@/store/features/userSlice"; // Adjust path as needed

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

// Add proper types for user and organization
interface User {
  id: string;
  email?: string;
  // Add other user properties as needed
}

interface Organization {
  id: string;
  name?: string;
  // Add other organization properties as needed
}

// Main Dashboard Content Component
const DashboardContent = ({
  user,
  organization,
  collapsed,
}: {
  user: User;
  organization: Organization;
  collapsed: boolean;
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux selectors
  const dashboardData = useSelector(selectDashboardData);
  const dashboardStats = useSelector(selectDashboardStats);
  const chartData = useSelector(selectDashboardChartData);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const userRole = useSelector(selectUserRole);

  // Transform stats for display
  const stats = dashboardStats ? [
    {
      label: "Active Jobs",
      value: dashboardStats.active_jobs.value,
      icon: (
        <BsBriefcase className="w-11 h-11 text-indigo-400 bg-indigo-100 rounded-2xl p-3" />
      ),
      change: `${dashboardStats.active_jobs.change > 0 ? '+' : ''}${dashboardStats.active_jobs.change}%`,
      changeDesc: "Up from yesterday",
      changeColor: dashboardStats.active_jobs.trend === 'up' ? "text-emerald-500" : 
                   dashboardStats.active_jobs.trend === 'down' ? "text-rose-500" : "text-neutral-500",
    },
    {
      label: "Application Received",
      value: dashboardStats.applications_received.value,
      icon: (
        <TiDocumentDelete className="w-11 h-11 text-amber-700/60 bg-amber-100 rounded-2xl p-3" />
      ),
      change: `${dashboardStats.applications_received.change > 0 ? '+' : ''}${dashboardStats.applications_received.change}%`,
      changeDesc: "Up from past week",
      changeColor: dashboardStats.applications_received.trend === 'up' ? "text-emerald-500" : 
                   dashboardStats.applications_received.trend === 'down' ? "text-rose-500" : "text-neutral-500",
    },
    {
      label: "Client Companies",
      value: dashboardStats.client_companies.value,
      icon: (
        <HiOutlineBuildingOffice2 className="w-11 h-11 text-green-400 bg-green-100 rounded-2xl p-3" />
      ),
      change: `${dashboardStats.client_companies.change > 0 ? '+' : ''}${dashboardStats.client_companies.change}%`,
      changeDesc: "Up from last month",
      changeColor: dashboardStats.client_companies.trend === 'up' ? "text-emerald-500" : 
                   dashboardStats.client_companies.trend === 'down' ? "text-rose-500" : "text-neutral-500",
    },
    {
      label: "Total Candidates",
      value: dashboardStats.total_candidates.value,
      icon: (
        <GoPeople className="w-11 h-11 text-orange-500 bg-red-200/80 rounded-2xl p-3" />
      ),
      change: `${dashboardStats.total_candidates.change > 0 ? '+' : ''}${dashboardStats.total_candidates.change}%`,
      changeDesc: "Up from past week",
      changeColor: dashboardStats.total_candidates.trend === 'up' ? "text-emerald-500" : 
                   dashboardStats.total_candidates.trend === 'down' ? "text-rose-500" : "text-neutral-500",
    },
  ] : [];

  // Fetch dashboard data on component mount
  useEffect(() => {
    if (user?.id && organization?.id) {
      dispatch(fetchDashboardData({
        userUuid: user.id,
        orgUuid: organization.id,
      }));
    }
  }, [dispatch, user?.id, organization?.id]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  // Custom tooltip component with proper types
  const CustomTooltip = ({ active, payload }: { 
    active?: boolean; 
    payload?: Array<{ value: number }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-blue-600 px-8 rounded-xs shadow-lg">
            <p className="text-sm text-white">
              {payload[0].value}
            </p>
          </div>
          <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-blue-600" />
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}>
        <div className="max-w-8xl mx-auto px-2 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-32 mb-4"></div>
            <div className="flex flex-wrap gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-neutral-200 rounded-2xl h-44 flex-1 min-w-3xs"></div>
              ))}
            </div>
            <div className="bg-neutral-200 rounded-2xl h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}>
        <div className="max-w-8xl mx-auto px-2 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                if (user?.id && organization?.id) {
                  dispatch(fetchDashboardData({
                    userUuid: user.id,
                    orgUuid: organization.id,
                  }));
                }
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}>
        <div className="max-w-8xl mx-auto px-2 py-4">
          <div className="text-center py-12">
            <p className="text-neutral-500">No dashboard data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}
    >
      <div className="max-w-8xl mx-auto px-2 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Dashboard
          </h1>
          {userRole && (
            <span className="text-sm text-neutral-500 capitalize">
              Role: {userRole}
            </span>
          )}
        </div>
        
        {/* Stat Cards */}
        <div className="flex flex-wrap gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl hover:shadow-sm transition-all duration-300 flex flex-col justify-between px-4 py-3 min-w-3xs h-auto flex-1"
            >
              {/* Top row: label, value, icon */}
              <div className="flex items-start sm:items-center justify-between w-full">
                <div className="flex-1">
                  <div className="text-neutral-500 text-sm font-medium mb-1">
                    {stat.label}
                  </div>
                  <div className="text-2xl lg:text-3xl font-semibold text-neutral-900">
                    {stat.value.toLocaleString()}
                  </div>
                </div>
                <div className="flex-shrink-0 relative -top-3 -right-1">
                  {stat.icon}
                </div>
              </div>
              {/* Change info at the bottom */}
              <div className="flex items-center gap-2 text-xs mt-6">
                <span
                  className={`${stat.changeColor} font-semibold whitespace-nowrap`}
                >
                  {stat.change}
                </span>
                <span className="text-neutral-400">
                  {stat.changeDesc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Applications Over Time Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
            <h2 className="text-xl font-semibold text-neutral-900">
              Applications Over Time
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button className="bg-neutral-100 text-neutral-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-200 transition-colors">
                Show by Company <FaCaretDown className="w-4 h-4" />
              </button>
              <button className="bg-neutral-100 text-neutral-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-200 transition-colors">
                Show by Role <FaCaretDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData || []}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="week" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorApplications)"
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3B82F6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data refresh info */}
        {dashboardData.generated_at && (
          <div className="mt-4 text-xs text-neutral-400 text-center">
            Last updated: {new Date(dashboardData.generated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  // Use global sidebar state
  const collapsed = useAppSelector((state: RootState) => state.ui.sidebar.collapsed);

  // User authentication data
  const user = useSelector((state: RootState) => state.user.user);
  const organization = useSelector((state: RootState) => state.user.organization);
  const isLoading = useSelector((state: RootState) => state.user.loading);
  const error = useSelector((state: RootState) => state.user.error);

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

    console.log("Initializing auth for dashboard...");
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
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-8">
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
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-8 flex justify-center items-center">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </div>
    );
  }

  // If no user after auth initialization, redirect to login
  if (!user && authInitialized.current && !isLoading) {
    return (
      <div
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-yellow-800 font-medium">Authentication Required</h3>
            <p className="text-yellow-700 mt-2">Please log in to access the dashboard.</p>
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
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-8">
          <InfoMessage
            message="You are not part of any organization. Please contact your administrator."
            type="info"
          />
        </div>
      </div>
    );
  }

  // Additional validation for required data
  if (!user || !user.id || !organization.id) {
    return (
      <div
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-8">
          <InfoMessage
            message="Invalid user or organization data. Please try refreshing the page."
            type="error"
          />
        </div>
      </div>
    );
  }

  return (
    <DashboardContent
      user={user}
      organization={organization}
      collapsed={collapsed}
    />
  );
}