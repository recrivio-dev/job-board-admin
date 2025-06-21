import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/utils/supabase/client";
import { createSelector } from "@reduxjs/toolkit";

// Types for the filter options
export interface FilterOption {
  value: string;
  label: string;
  logo_url?: string;
  job_location_type?: string;
}

export interface CompaniesResponse {
  companies: FilterOption[];
  success: boolean;
  error?: string;
}

export interface LocationsResponse {
  locations: FilterOption[];
  success: boolean;
  error?: string;
}

export interface FilterOptionsResponse {
  companies: FilterOption[];
  locations: FilterOption[];
  statuses: string[];
  cached?: boolean;
  success: boolean;
  error?: string;
}

// Enhanced type definitions based on your database schema
export interface Job {
  id: string;
  title: string;
  description: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  location: string | null;
  job_location_type: string | null;
  job_type: string | null;
  working_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  min_experience_needed: number | null;
  max_experience_needed: number | null;
  application_deadline: string | null;
  status: string | null;
  created_by: string | null;
  organization_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Access control fields
  has_access?: boolean;
  access_type?: string;
  granted_by?: string;
}

// Raw job type from database (matching your current structure)
export interface RawJob {
  id: string;
  organization_id: string | null;
  title: string;
  description: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  location: string | null;
  job_location_type: string | null;
  job_type: string | null;
  working_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  min_experience_needed: number | null;
  max_experience_needed: number | null;
  application_deadline: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Job access control interface
export interface JobAccessControl {
  id: string;
  job_id: string;
  user_id: string;
  access_type: "granted" | "revoked";
  granted_by: string | null;
  created_at: string;
  user_profiles?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  granted_by_profile?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

// Job filters
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

interface JobState {
  jobs: Job[];
  filteredJobs: Job[];
  selectedJob: Job | null;
  loading: boolean;
  error: string | null;
  viewMode: "board" | "list";
  filters: JobFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  userAccess: JobAccessControl[];
  // New filter options state
  filterOptions: {
    companies: string[];
    locations: string[];
    statuses: string[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
  };
}

// Initial state
const initialState: JobState = {
  jobs: [],
  filteredJobs: [],
  selectedJob: null,
  filters: {},
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 18,
  },
  filterOptions: {
    companies: [],
    locations: [],
    statuses: ["active, paused, closed"],
    loading: false,
    error: null,
    lastFetched: null,
  },
  viewMode: "board",
  userAccess: [],
};

// Utility function to transform raw job to normalized job
const transformRawJob = (rawJob: RawJob): Job => ({
  id: rawJob.id,
  title: rawJob.title,
  description: rawJob.description,
  company_name: rawJob.company_name,
  company_logo_url: rawJob.company_logo_url,
  location: rawJob.location,
  job_location_type: rawJob.job_location_type,
  job_type: rawJob.job_type,
  working_type: rawJob.working_type,
  salary_min: rawJob.salary_min,
  salary_max: rawJob.salary_max,
  min_experience_needed: rawJob.min_experience_needed,
  max_experience_needed: rawJob.max_experience_needed,
  application_deadline: rawJob.application_deadline,
  status: rawJob.status,
  created_by: rawJob.created_by,
  organization_id: rawJob.organization_id,
  created_at: rawJob.created_at,
  updated_at: rawJob.updated_at,
});

// Type definition for RPC response
interface FetchJobsRPCResponse {
  jobs: Job[];
  total_count: number;
  current_page: number;
  total_pages: number;
  success: boolean;
  error?: string;
}

// Type guard to check if the response is a valid RPC response
const isFetchJobsRPCResponse = (data: any): data is FetchJobsRPCResponse => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.success === 'boolean' &&
    typeof data.total_count === 'number' &&
    typeof data.current_page === 'number' &&
    typeof data.total_pages === 'number' &&
    Array.isArray(data.jobs)
  );
};

export const fetchJobs = createAsyncThunk(
  "jobs/fetchJobs",
  async (
    params: {
      page?: number;
      limit?: number;
      filters?: JobFilters;
      userRole?: string;
      userId?: string;
      organizationId?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const supabase = createClient();
      const {
        page = 1,
        limit = 18,
        filters = {},
        userRole,
        userId,
        organizationId,
      } = params;

      // Validate required parameters
      if (!userRole || !userId) {
        return rejectWithValue("User role and user ID are required");
      }

      // For admin/hr roles, organization ID is required
      if ((userRole === "admin" || userRole === "hr") && !organizationId) {
        return rejectWithValue("Organization ID is required for admin/hr roles");
      }

      // Call the RPC function
      const { data, error } = await supabase.rpc("fetch_jobs_with_access", {
        p_user_id: userId,
        p_user_role: userRole,
        p_organization_id: organizationId,
        p_page: page,
        p_limit: limit,
        p_status: filters.status || undefined,
        p_location: filters.location || undefined,
        p_company: filters.company || undefined,
        p_job_type: filters.jobType || undefined,
        p_salary_min: filters.salaryRange?.min || undefined,
        p_salary_max: filters.salaryRange?.max || undefined,
        p_experience_min: filters.experienceLevel ? parseInt(filters.experienceLevel.split('-')[0]) : undefined,
        p_experience_max: filters.experienceLevel ? parseInt(filters.experienceLevel.split('-')[1]) : undefined,
      });

      if (error) {
        return rejectWithValue(error.message);
      }

      // Type guard check
      if (!isFetchJobsRPCResponse(data)) {
        return rejectWithValue("Invalid response format from server");
      }

      // Check if the RPC function returned an error
      if (!data.success) {
        return rejectWithValue(data.error || "Failed to fetch jobs");
      }

      return {
        jobs: data.jobs || [],
        totalCount: data.total_count || 0,
        currentPage: data.current_page || page,
        totalPages: data.total_pages || 0,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch jobs";
      return rejectWithValue(errorMessage);
    }
  }
);

const isFilterOptionsRPCResponse = (data: any): data is FilterOptionsResponse => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'companies' in data &&
    'locations' in data &&
    'success' in data &&
    Array.isArray(data.companies) &&
    Array.isArray(data.locations)
  );
};
// Combined thunk for fetching both companies and locations
export const fetchFilterOptions = createAsyncThunk(
  "jobs/fetchFilterOptions",
  async (
    params: {
      userRole: string;
      userId: string;
      organizationId?: string;
      forceRefresh?: boolean;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { jobs: JobState };
      const { filterOptions } = state.jobs;

      // Check if we should skip fetching (cache for 5 minutes)
      const cacheValid = filterOptions.lastFetched &&
        Date.now() - filterOptions.lastFetched < 5 * 60 * 1000;

      if (!params.forceRefresh && cacheValid && filterOptions.companies.length > 0) {
        return {
          companies: filterOptions.companies,
          locations: filterOptions.locations,
          statuses: filterOptions.statuses,
          cached: true,
        };
      }

      const supabase = createClient();
      const { userRole, userId, organizationId } = params;

      // Validate required parameters
      if (!userRole || !userId) {
        return rejectWithValue("User role and user ID are required");
      }

      // For admin/hr roles, organization ID is required
      if ((userRole === "admin" || userRole === "hr") && !organizationId) {
        return rejectWithValue("Organization ID is required for admin/hr roles");
      }

      // Call the RPC function
      const { data, error } = await supabase.rpc("fetch_filter_options", {
        p_user_id: userId,
        p_user_role: userRole,
        p_organization_id: organizationId,
      });

      if (error) {
        return rejectWithValue(error.message);
      }

      // Type guard check
      if (!isFilterOptionsRPCResponse(data)) {
        return rejectWithValue("Invalid response format from server");
      }

      // Check if the RPC function returned an error
      if (!data.success) {
        return rejectWithValue(data.error || "Failed to fetch filter options");
      }

      // Define default statuses if not provided by server
      const defaultStatuses = ["active", "paused", "closed"];

      return {
        companies: (data.companies || []).sort(),
        locations: (data.locations || []).sort(),
        statuses: defaultStatuses,
        cached: false,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch filter options";
      return rejectWithValue(errorMessage);
    }
  }
);

// Grant job access to a user (admin/hr only)
export const grantJobAccess = createAsyncThunk(
  "jobs/grantJobAccess",
  async (
    {
      jobId,
      userId,
      grantedBy,
    }: { jobId: string; userId: string; grantedBy: string },
    { rejectWithValue }
  ) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("job_access_control")
        .upsert(
          [
            {
              job_id: jobId,
              user_id: userId,
              access_type: "granted",
              granted_by: grantedBy,
            },
          ],
          {
            onConflict: "job_id,user_id",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as JobAccessControl;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to grant job access";
      return rejectWithValue(errorMessage);
    }
  }
);

// Revoke job access from a user (admin/hr only)
export const revokeJobAccess = createAsyncThunk(
  "jobs/revokeJobAccess",
  async (
    {
      jobId,
      userId,
      revokedBy,
    }: { jobId: string; userId: string; revokedBy: string },
    { rejectWithValue }
  ) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("job_access_control")
        .upsert(
          [
            {
              job_id: jobId,
              user_id: userId,
              access_type: "revoked",
              granted_by: revokedBy,
            },
          ],
          {
            onConflict: "job_id,user_id",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as JobAccessControl;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to revoke job access";
      return rejectWithValue(errorMessage);
    }
  }
);

// Get job access control list for a specific job
export const fetchJobAccessControl = createAsyncThunk(
  "jobs/fetchJobAccessControl",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("job_access_control")
        .select(
          `
                    *,
                    user_profiles!job_access_control_user_id_fkey (
                        id,
                        full_name,
                        email
                    ),
                    granted_by_profile:user_profiles!job_access_control_granted_by_fkey (
                        id,
                        full_name,
                        email
                    )
                `
        )
        .eq("job_id", jobId)
        .eq("access_type", "granted");

      if (error) {
        return rejectWithValue(error.message);
      }

      return data || [];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch job access control";
      return rejectWithValue(errorMessage);
    }
  }
);

// Enhanced thunk for applying filters with server-side filtering
export const applyFilters = createAsyncThunk(
  "jobs/applyFilters",
  async (
    params: {
      filters: JobFilters;
      userRole: string;
      userId: string;
      organizationId?: string;
      page?: number;
      preservePageSize?: boolean;
    },
    { dispatch, getState }
  ) => {
    const state = getState() as { jobs: JobState };
    const currentPageSize = state.jobs.pagination.pageSize;
    const targetPage = params.page || 1;

    // Update filters in state first
    dispatch(setFilters(params.filters));

    // If page is not specified and filters changed, reset to page 1
    if (!params.page) {
      dispatch(setCurrentPage(1));
    }

    // Then fetch jobs with new filters
    const result = await dispatch(fetchJobs({
      page: targetPage,
      limit: currentPageSize,
      filters: params.filters,
      userRole: params.userRole,
      userId: params.userId,
      organizationId: params.organizationId,
    }));

    return result;
  }
);

// Enhanced thunk for pagination that respects current filters
export const goToPage = createAsyncThunk(
  "jobs/goToPage",
  async (
    params: {
      page: number;
      userRole: string;
      userId: string;
      organizationId?: string;
    },
    { dispatch, getState }
  ) => {
    const state = getState() as { jobs: JobState };
    const { filters, pagination } = state.jobs;

    // Update current page
    dispatch(setCurrentPage(params.page));

    // Fetch jobs for the new page with current filters
    return dispatch(fetchJobs({
      page: params.page,
      limit: pagination.pageSize,
      filters,
      userRole: params.userRole,
      userId: params.userId,
      organizationId: params.organizationId,
    }));
  }
);

export const fetchJobById = createAsyncThunk(
  "jobs/fetchJobById",
  async (
    {
      jobId,
      userId,
      userRole,
    }: { jobId: string; userId?: string; userRole?: string },
    { rejectWithValue }
  ) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      const job = transformRawJob(data);

      // Check access for TA users
      if (userRole === "ta" && userId) {
        const { data: accessData, error: accessError } = await supabase
          .from("job_access_control")
          .select("access_type")
          .eq("job_id", jobId)
          .eq("user_id", userId)
          .eq("access_type", "granted")
          .single();

        if (accessError && accessError.code !== "PGRST116") {
          return rejectWithValue("Failed to check job access");
        }

        if (!accessData) {
          return rejectWithValue(
            "Access denied: You do not have permission to view this job"
          );
        }

        job.has_access = true;
        job.access_type = accessData.access_type || undefined;
      }

      return job;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch job";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createJob = createAsyncThunk(
  "jobs/createJob",
  async (
    jobData: Omit<RawJob, "id" | "created_at" | "updated_at">,
    { rejectWithValue }
  ) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("jobs")
        .insert([jobData])
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      // Now add access control entry using the newly created job's id
      const accessControl = {
        job_id: data.id, // Use the id from the created job
        user_id: jobData.created_by,
        access_type: "granted" as const,
        granted_by: jobData.created_by, // The creator grants access to themselves
      };

      const { error: accessError } = await supabase
        .from("job_access_control")
        .insert([accessControl]);

      if (accessError) {
        // If access control creation fails, you might want to delete the job
        // to maintain data consistency, or handle this differently based on your needs
        console.error("Failed to create access control:", accessError.message);
        return rejectWithValue(accessError.message);
      }

      return transformRawJob(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create job";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateJob = createAsyncThunk(
  "jobs/updateJob",
  async (
    { jobId, updates }: { jobId: string; updates: Partial<RawJob> },
    { rejectWithValue }
  ) => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", jobId)
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return transformRawJob(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update job";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteJob = createAsyncThunk(
  "jobs/deleteJob",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const supabase = createClient();

      const { error } = await supabase.from("jobs").delete().eq("id", jobId);

      if (error) {
        return rejectWithValue(error.message);
      }

      return jobId;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete job";
      return rejectWithValue(errorMessage);
    }
  }
);

// Job slice
const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<RawJob[]>) => {
      state.jobs = action.payload.map(transformRawJob);
      state.filteredJobs = state.jobs;
      state.loading = false;
      state.error = null;
    },

    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload;
    },

    setViewMode: (state, action: PayloadAction<"board" | "list">) => {
      state.viewMode = action.payload;
    },

    // Modified setFilters - now only updates filter state, actual filtering happens via fetchJobs
    setFilters: (state, action: PayloadAction<JobFilters>) => {
      const oldFilters = state.filters;
      const newFilters = action.payload;

      // Check if filters actually changed
      const filtersChanged = JSON.stringify(oldFilters) !== JSON.stringify(newFilters);

      state.filters = newFilters;

      // Reset to first page only if filters actually changed
      if (filtersChanged) {
        state.pagination.currentPage = 1;
      }
    },

    clearFilters: (state) => {
      state.filters = {};
      state.pagination.currentPage = 1;
    },

    // New action to clear filter options cache
    clearFilterOptionsCache: (state) => {
      state.filterOptions.lastFetched = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearSelectedJob: (state) => {
      state.selectedJob = null;
    },

    updateJobAccess: (
      state,
      action: PayloadAction<{
        jobId: string;
        hasAccess: boolean;
        accessType: string;
      }>
    ) => {
      const { jobId, hasAccess, accessType } = action.payload;
      const jobIndex = state.jobs.findIndex((job) => job.id === jobId);
      if (jobIndex !== -1) {
        state.jobs[jobIndex].has_access = hasAccess;
        state.jobs[jobIndex].access_type = accessType;
      }
      const filteredJobIndex = state.filteredJobs.findIndex(
        (job) => job.id === jobId
      );
      if (filteredJobIndex !== -1) {
        state.filteredJobs[filteredJobIndex].has_access = hasAccess;
        state.filteredJobs[filteredJobIndex].access_type = accessType;
      }
    },

    // Pagination actions
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when changing page size
    },

    updatePaginationInfo: (state, action: PayloadAction<{ totalCount: number; pageSize?: number }>) => {
      const { totalCount, pageSize } = action.payload;
      state.pagination.totalCount = totalCount;
      if (pageSize) {
        state.pagination.pageSize = pageSize;
      }
      state.pagination.totalPages = Math.ceil(totalCount / state.pagination.pageSize);
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Jobs - now properly handles filtered results from server
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        // Server returns filtered results, so we don't need separate filteredJobs
        state.jobs = action.payload.jobs;
        state.filteredJobs = action.payload.jobs;
        state.pagination = {
          ...state.pagination,
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalCount: action.payload.totalCount,
        };
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to fetch jobs";
      })

      // Fetch Job by ID
      .addCase(fetchJobById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedJob = action.payload;
        state.error = null;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to fetch job";
      })

      // Create Job
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false;
        // Only add to current view if it matches current filters
        // For simplicity, we'll just refresh the job list after creation
        state.error = null;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to create job";
      })

      // Update Job
      .addCase(updateJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.jobs.findIndex(
          (job) => job.id === action.payload.id
        );
        if (index !== -1) {
          state.jobs[index] = action.payload;
          state.filteredJobs[index] = action.payload;
        }
        if (state.selectedJob?.id === action.payload.id) {
          state.selectedJob = action.payload;
        }
        state.error = null;
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to update job";
      })

      // Delete Job
      .addCase(deleteJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = state.jobs.filter((job) => job.id !== action.payload);
        state.filteredJobs = state.filteredJobs.filter(
          (job) => job.id !== action.payload
        );
        if (state.selectedJob?.id === action.payload) {
          state.selectedJob = null;
        }
        state.error = null;
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to delete job";
      })

      // Grant Job Access
      .addCase(grantJobAccess.fulfilled, (state, action) => {
        const accessControl = action.payload;
        state.userAccess.push(accessControl);
        // Update job access status in state
        const jobIndex = state.jobs.findIndex(
          (job) => job.id === accessControl.job_id
        );
        if (jobIndex !== -1) {
          state.jobs[jobIndex].has_access = true;
          state.jobs[jobIndex].access_type = "granted";
        }
        const filteredJobIndex = state.filteredJobs.findIndex(
          (job) => job.id === accessControl.job_id
        );
        if (filteredJobIndex !== -1) {
          state.filteredJobs[filteredJobIndex].has_access = true;
          state.filteredJobs[filteredJobIndex].access_type = "granted";
        }
      })

      // Revoke Job Access
      .addCase(revokeJobAccess.fulfilled, (state, action) => {
        const accessControl = action.payload;
        const accessIndex = state.userAccess.findIndex(
          (access) =>
            access.job_id === accessControl.job_id &&
            access.user_id === accessControl.user_id
        );
        if (accessIndex !== -1) {
          state.userAccess[accessIndex] = accessControl;
        }
        // Update job access status in state
        const jobIndex = state.jobs.findIndex(
          (job) => job.id === accessControl.job_id
        );
        if (jobIndex !== -1) {
          state.jobs[jobIndex].has_access = false;
          state.jobs[jobIndex].access_type = "revoked";
        }
        const filteredJobIndex = state.filteredJobs.findIndex(
          (job) => job.id === accessControl.job_id
        );
        if (filteredJobIndex !== -1) {
          state.filteredJobs[filteredJobIndex].has_access = false;
          state.filteredJobs[filteredJobIndex].access_type = "revoked";
        }
      })

      // Fetch Job Access Control
      .addCase(fetchJobAccessControl.fulfilled, (state, action) => {
        // Store access control data for the specific job, filtering out entries with null job_id or user_id
        state.userAccess = action.payload
          .filter(
            (access) =>
              access.job_id !== null &&
              access.user_id !== null &&
              access.created_at !== null
          )
          .map((access) => ({
            ...access,
            job_id: access.job_id!,
            user_id: access.user_id!,
            created_at: access.created_at!,
            access_type: access.access_type as "granted" | "revoked",
          }));

      })
      .addCase(fetchFilterOptions.pending, (state) => {
        state.filterOptions.loading = true;
        state.filterOptions.error = null;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptions.loading = false;
        state.filterOptions.companies = Array.isArray(action.payload.companies)
          ? action.payload.companies.map(company =>
            typeof company === 'string' ? company : company.value
          )
          : action.payload.companies;
        state.filterOptions.locations = Array.isArray(action.payload.locations)
          ? action.payload.locations.map(location =>
            typeof location === 'string' ? location : location.value
          )
          : action.payload.locations;
        state.filterOptions.statuses = action.payload.statuses;
        state.filterOptions.error = null;

        // Only update timestamp if not from cache
        if (!action.payload.cached) {
          state.filterOptions.lastFetched = Date.now();
        }
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.filterOptions.loading = false;
        state.filterOptions.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to fetch filter options";
      })

      // Apply Filters cases
      .addCase(applyFilters.pending, (state) => {
        // Don't set main loading to true for filter applications
        // This prevents UI flicker
      })
      .addCase(applyFilters.fulfilled, (state) => {
        // Filter application completed successfully
        // The actual job data update is handled by fetchJobs.fulfilled
      })
      .addCase(applyFilters.rejected, (state, action) => {
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to apply filters";
      });
  },
});

export const {
  setJobs,
  setSelectedJob,
  setViewMode,
  setFilters,
  clearFilters,
  clearError,
  clearSelectedJob,
  updateJobAccess,
  setCurrentPage,
  clearFilterOptionsCache,
  setPageSize,
  updatePaginationInfo,
} = jobSlice.actions;

export default jobSlice.reducer;

// Enhanced Selectors
export const selectJobs = (state: { jobs: JobState }) =>
  state.jobs.filteredJobs;
export const selectAllJobs = (state: { jobs: JobState }) => state.jobs.jobs;

// Memoized selectors

// Memoized job stats selector to prevent unnecessary rerenders
export const selectJobStats = createSelector([selectAllJobs], (jobs) => ({
  total: jobs.length,
  active: jobs.filter((job) => job.status === "active").length,
  draft: jobs.filter((job) => job.status === "draft").length,
  closed: jobs.filter((job) => job.status === "closed").length,
  accessible: jobs.filter((job) => job.has_access === true).length,
  restricted: jobs.filter((job) => job.has_access === false).length,
}));

// Memoized accessible jobs selector
export const selectAccessibleJobsMemoized = createSelector(
  [selectAllJobs],
  (jobs) => jobs.filter((job) => job.has_access !== false)
);

// Memoized jobs with access selector
export const selectJobsWithAccessMemoized = createSelector(
  [selectAllJobs],
  (jobs) => jobs.filter((job) => job.has_access === true)
);

// Memoized jobs without access selector
export const selectJobsWithoutAccessMemoized = createSelector(
  [selectAllJobs],
  (jobs) => jobs.filter((job) => job.has_access === false)
);
export const selectSelectedJob = (state: { jobs: JobState }) =>
  state.jobs.selectedJob;
export const selectJobsLoading = (state: { jobs: JobState }) =>
  state.jobs.loading;
export const selectJobsError = (state: { jobs: JobState }) => state.jobs.error;
export const selectJobFilters = (state: { jobs: JobState }) =>
  state.jobs.filters;
export const selectJobPagination = (state: { jobs: JobState }) =>
  state.jobs.pagination;
export const selectJobViewMode = (state: { jobs: JobState }) =>
  state.jobs.viewMode;
export const selectUserAccess = (state: { jobs: JobState }) =>
  state.jobs.userAccess;

// Role-based selectors
export const selectAccessibleJobs = (state: { jobs: JobState }) =>
  state.jobs.jobs.filter((job) => job.has_access !== false);

export const selectJobsWithAccess = (state: { jobs: JobState }) =>
  state.jobs.jobs.filter((job) => job.has_access === true);

export const selectJobsWithoutAccess = (state: { jobs: JobState }) =>
  state.jobs.jobs.filter((job) => job.has_access === false);

// Derived selectors
export const selectJobsByStatus =
  (status: string) => (state: { jobs: JobState }) =>
    state.jobs.jobs.filter((job) => job.status === status);

export const selectJobsCount = (state: { jobs: JobState }) =>
  state.jobs.jobs.length;

export const selectJobById = (jobId: string) => (state: { jobs: JobState }) =>
  state.jobs.jobs.find((job) => job.id === jobId);

// Access control selectors
export const selectJobAccessByJobId =
  (jobId: string) => (state: { jobs: JobState }) =>
    state.jobs.userAccess.filter((access) => access.job_id === jobId);

export const selectUserJobAccess =
  (userId: string) => (state: { jobs: JobState }) =>
    state.jobs.userAccess.filter(
      (access) => access.user_id === userId && access.access_type === "granted"
    );

// Paginated jobs selector
export const selectPaginatedJobs = createSelector(
  [selectJobs, selectJobPagination],
  (jobs, pagination) => {
    const { currentPage, pageSize } = pagination;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return jobs.slice(startIndex, endIndex);
  }
);

export const selectFilterOptions = (state: { jobs: JobState }) => state.jobs.filterOptions;
export const selectFilterOptionsLoading = (state: { jobs: JobState }) => state.jobs.filterOptions.loading;
export const selectFilterOptionsError = (state: { jobs: JobState }) => state.jobs.filterOptions.error;

// Memoized selectors for better performance
export const selectAvailableCompanies = createSelector(
  [selectFilterOptions],
  (filterOptions) => filterOptions.companies
);

export const selectAvailableLocations = createSelector(
  [selectFilterOptions],
  (filterOptions) => filterOptions.locations
);

export const selectAvailableStatuses = createSelector(
  [selectFilterOptions],
  (filterOptions) => filterOptions.statuses
);