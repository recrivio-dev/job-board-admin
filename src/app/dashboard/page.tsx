"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { TiDocumentDelete } from "react-icons/ti";
import { BsBriefcase } from "react-icons/bs";
import { FaCaretDown } from "react-icons/fa";
import { GoPeople } from "react-icons/go";
import Link from "next/link";
import { AppDispatch, RootState } from "@/store/store";
import { useAppSelector } from "@/store/hooks";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { Suspense } from "react";

// Import selectors and actions
import {
  fetchDashboardData,
  fetchApplicationsOverTime,
  selectDashboardData,
  selectDashboardStats,
  selectDashboardChartData,
  selectDashboardLoading,
  selectDashboardError,
  selectUserRole,
  clearError,
  selectTopJobs,
  selectTopCompanies,
} from "@/store/features/dashboardSlice";

import { initializeAuth } from "@/store/features/userSlice";

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

// Dropdown component for companies and jobs
const FilterDropdown = ({
  label,
  items,
  selectedItem,
  onSelect,
  isOpen,
  onToggle,
}: {
  label: string;
  items: Array<{ id: string; name: string; count?: number }>;
  selectedItem: string | null;
  onSelect: (item: { id: string; name: string }) => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (isOpen) onToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="bg-neutral-100 text-neutral-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-200 transition-colors min-w-[140px] justify-between"
      >
        <span className="truncate">{selectedItem ? selectedItem : label}</span>
        <FaCaretDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto">
          <div className="py-1">
            {items.length > 0 ? (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onToggle();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center justify-between"
                >
                  <span className="truncate">{item.name}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                No {label.toLowerCase()} available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Add proper types for user and organization
interface User {
  id: string;
  email?: string;
  // Add other user properties as needed
}

interface Organization {
  id: string;
  name?: string;
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
  const topJobs = useSelector(selectTopJobs);
  const topCompanies = useSelector(selectTopCompanies);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const userRole = useSelector(selectUserRole);

  // State for dropdown filters
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);

  console.log(topJobs, topCompanies, "Top Jobs and Companies Data");

  // Demo function to handle company selection
  const handleCompanySelect = (company: { id: string; name: string }) => {
    setSelectedCompany(company.name);
    setSelectedJob(null); // Reset job filter when company is selected
    console.log("Selected company:", company);
    // Dispatch action to filter chart data by company
    dispatch(
      fetchApplicationsOverTime({
        userUuid: user.id,
        orgUuid: organization.id,
        company_name: company.name,
        job_title: undefined,
      })
    );
  };

  // Demo function to handle job selection
  const handleJobSelect = (job: { id: string; name: string }) => {
    setSelectedJob(job.name);
    setSelectedCompany(null); // Reset company filter when job is selected
    console.log("Selected job:", job);
    // Dispatch action to filter chart data by job
    dispatch(
      fetchApplicationsOverTime({
        userUuid: user.id,
        orgUuid: organization.id,
        job_title: job.name,
        company_name: undefined,
      })
    );
    // 3. Possibly calling an API endpoint with the job filter
  };

  // Reset filters function
  const handleResetFilters = () => {
    setSelectedCompany(null);
    setSelectedJob(null);
    console.log("Filters reset - showing all data");
    dispatch(
      fetchApplicationsOverTime({
        userUuid: user.id,
        orgUuid: organization.id,
        company_name: undefined,
        job_title: undefined,
      })
    );
    // TODO: Dispatch action to reset chart data to show all
  };

  // Transform top companies data for dropdown
  const companyDropdownItems =
    topCompanies?.map((company) => ({
      id: String(Math.random()), // Handle different possible id fields
      name: company.name || "Unknown Company",
      count: company.value,
    })) || [];

  // Transform top jobs data for dropdown
  const jobDropdownItems =
    topJobs?.map((job) => ({
      id: String(Math.random()), // Handle different possible id fields
      name: job.name || "Unknown Job",
      count: job.value,
    })) || [];

  // Transform stats for display
  const stats = dashboardStats
    ? [
        {
          label: "Active Jobs",
          value: dashboardStats.active_jobs.value,
          icon: (
            <BsBriefcase className="w-11 h-11 text-indigo-400 bg-indigo-100 rounded-2xl p-3" />
          ),
          change: `${dashboardStats.active_jobs.change > 0 ? "+" : ""}${
            dashboardStats.active_jobs.change
          }%`,
          changeDesc: "Up from yesterday",
          changeColor:
            dashboardStats.active_jobs.trend === "up"
              ? "text-emerald-500"
              : dashboardStats.active_jobs.trend === "down"
              ? "text-rose-500"
              : "text-neutral-500",
        },
        {
          label: "Application Received",
          value: dashboardStats.applications_received.value,
          icon: (
            <TiDocumentDelete className="w-11 h-11 text-amber-700/60 bg-amber-100 rounded-2xl p-3" />
          ),
          change: `${
            dashboardStats.applications_received.change > 0 ? "+" : ""
          }${dashboardStats.applications_received.change}%`,
          changeDesc: "Up from past week",
          changeColor:
            dashboardStats.applications_received.trend === "up"
              ? "text-emerald-500"
              : dashboardStats.applications_received.trend === "down"
              ? "text-rose-500"
              : "text-neutral-500",
        },
        {
          label: "Client Companies",
          value: dashboardStats.client_companies.value,
          icon: (
            <HiOutlineBuildingOffice2 className="w-11 h-11 text-green-400 bg-green-100 rounded-2xl p-3" />
          ),
          change: `${dashboardStats.client_companies.change > 0 ? "+" : ""}${
            dashboardStats.client_companies.change
          }%`,
          changeDesc: "Up from last month",
          changeColor:
            dashboardStats.client_companies.trend === "up"
              ? "text-emerald-500"
              : dashboardStats.client_companies.trend === "down"
              ? "text-rose-500"
              : "text-neutral-500",
        },
        {
          label: "Total Candidates",
          value: dashboardStats.total_candidates.value,
          icon: (
            <GoPeople className="w-11 h-11 text-orange-500 bg-red-200/80 rounded-2xl p-3" />
          ),
          change: `${dashboardStats.total_candidates.change > 0 ? "+" : ""}${
            dashboardStats.total_candidates.change
          }%`,
          changeDesc: "Up from past week",
          changeColor:
            dashboardStats.total_candidates.trend === "up"
              ? "text-emerald-500"
              : dashboardStats.total_candidates.trend === "down"
              ? "text-rose-500"
              : "text-neutral-500",
        },
      ]
    : [];

  // Fetch dashboard data on component mount
  useEffect(() => {
    if (user?.id && organization?.id) {
      dispatch(
        fetchDashboardData({
          userUuid: user.id,
          orgUuid: organization.id,
        })
      );
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
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-blue-600 px-8 rounded-xs shadow-lg">
            <p className="text-sm text-white">{payload[0].value}</p>
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
      <div
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardSkeleton />
        </Suspense>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                if (user?.id && organization?.id) {
                  dispatch(
                    fetchDashboardData({
                      userUuid: user.id,
                      orgUuid: organization.id,
                    })
                  );
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
      <div
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
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
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
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
                <span className="text-neutral-400">{stat.changeDesc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Applications Over Time Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-neutral-900">
                Applications Over Time
              </h2>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-2 flex-wrap">
              <FilterDropdown
                label="Show by Company"
                items={companyDropdownItems}
                selectedItem={selectedCompany}
                onSelect={handleCompanySelect}
                isOpen={isCompanyDropdownOpen}
                onToggle={() =>
                  setIsCompanyDropdownOpen(!isCompanyDropdownOpen)
                }
              />

              <FilterDropdown
                label="Show by Role"
                items={jobDropdownItems}
                selectedItem={selectedJob}
                onSelect={handleJobSelect}
                isOpen={isJobDropdownOpen}
                onToggle={() => setIsJobDropdownOpen(!isJobDropdownOpen)}
              />
            </div>
            {(selectedCompany || selectedJob) && (
              <div className="flex items-center justify-end">
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
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
                  <linearGradient
                    id="colorApplications"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#9CA3AF" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorApplications)"
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#3B82F6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data refresh info */}
        {dashboardData.generated_at && (
          <div className="mt-4 text-xs text-neutral-400 text-center">
            Last updated:{" "}
            {new Date(dashboardData.generated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  // Use global sidebar state
  const collapsed = useAppSelector(
    (state: RootState) => state.ui.sidebar.collapsed
  );

  // User authentication data
  const user = useAppSelector((state: RootState) => state.user.user);
  const organization = useAppSelector(
    (state: RootState) => state.user.organization
  );
  const isLoading = useAppSelector((state: RootState) => state.user.loading);
  const error = useAppSelector((state: RootState) => state.user.error);

  const authInitialized = useRef(false);

  // **FIXED**: Initialize auth once when component mounts
  useEffect(() => {
    // Only initialize if we haven't checked auth yet and don't have user data
    if (!authInitialized.current && !user && !isLoading && !error) {
      console.log("Initializing auth for dashboard...");
      dispatch(initializeAuth());
      authInitialized.current = true;
    }
  }, [dispatch, user, isLoading, authInitialized, error]);

  // Reset auth initialization flag when user logs out
  useEffect(() => {
    if (error && authInitialized.current) {
      console.log("User error detected, resetting auth initialization flag");
      authInitialized.current = false;
    }
  }, [error]);

  // **FIXED**: Show loading only when actually loading and no user data exists
  if (isLoading && !user) {
    return (
      <div
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-8 flex justify-center items-center">
          <div className="w-full flex justify-center items-center min-h-[200px] bg-neutral-100 animate-pulse rounded-lg">
            Loading...
          </div>
        </div>
      </div>
    );
  }

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
            <div className="mt-4 space-x-2">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go to Login
              </Link>
              <button
                onClick={() => {
                  // Reset auth initialization flag
                  authInitialized.current = false;
                  dispatch(initializeAuth());
                }}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // **FIXED**: Only show this if auth has been checked and still no user
  if (authInitialized.current && !user && !isLoading) {
    return (
      <div
        className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-yellow-800 font-medium">
              Authentication Required
            </h3>
            <p className="text-yellow-700 mt-2">
              Please log in to access the dashboard.
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

  // Handle missing organization (only show after we have a user but no org)
  if (user && !organization) {
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
  if (user && (!user.id || (organization && !organization.id))) {
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

  // **FIXED**: Only render dashboard if we have all required data
  if (user && organization) {
    return (
      <DashboardContent
        user={user}
        organization={organization}
        collapsed={collapsed}
      />
    );
  }

  // **FIXED**: Default loading state for initial render
  return (
    <div
      className={`transition-all duration-300 min-h-full px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}
    >
      <div className="max-w-8xl mx-auto px-2 py-8 flex justify-center items-center">
        <div className="w-full flex justify-center items-center min-h-[200px] bg-neutral-100 animate-pulse rounded-lg">
          Initializing...
        </div>
      </div>
    </div>
  );
}
