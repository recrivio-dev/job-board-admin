import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { createClient } from "@/utils/supabase/client";
import { createSelector } from "@reduxjs/toolkit";

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

// Job state interface
interface JobState {
  jobs: Job[];
  filteredJobs: Job[];
  selectedJob: Job | null;
  filters: JobFilters;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  viewMode: "board" | "list";
  userAccess: JobAccessControl[];
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

// Enhanced fetch jobs with role-based access control
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

      let jobsQuery;
      let accessibleJobIds: string[] = [];

      // Role-based query logic
      if (userRole === "admin" && organizationId) {
        // Admin can see all jobs in their organization
        jobsQuery = supabase
          .from("jobs")
          .select("*", { count: "exact" })
          .eq("organization_id", organizationId);
      } else if (userRole === "hr" && organizationId) {
        // HR can see all jobs in their organization
        jobsQuery = supabase
          .from("jobs")
          .select("*", { count: "exact" })
          .eq("organization_id", organizationId);
      } else if (userRole === "ta" && userId) {
        // TA can only see jobs they have access to
        // First, get job IDs they have access to
        const { data: accessData, error: accessError } = await supabase
          .from("job_access_control")
          .select("job_id")
          .eq("user_id", userId)
          .eq("access_type", "granted");

        if (accessError) {
          return rejectWithValue(accessError.message);
        }

        accessibleJobIds =
          accessData
            ?.map((item) => item.job_id)
            .filter((id): id is string => id !== null) || [];

        if (accessibleJobIds.length === 0) {
          // No accessible jobs for TA
          return {
            jobs: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
          };
        }

        jobsQuery = supabase
          .from("jobs")
          .select("*", { count: "exact" })
          .in("id", accessibleJobIds);
      } else {
        // Default: no access
        return {
          jobs: [],
          totalCount: 0,
          currentPage: page,
          totalPages: 0,
        };
      }

      // Apply filters
      if (filters.status) {
        jobsQuery = jobsQuery.eq("status", filters.status);
      }
      if (filters.location) {
        jobsQuery = jobsQuery.ilike("location", `%${filters.location}%`);
      }
      if (filters.company) {
        jobsQuery = jobsQuery.ilike("company_name", `%${filters.company}%`);
      }
      if (filters.jobType) {
        jobsQuery = jobsQuery.eq("job_type", filters.jobType);
      }
      if (filters.salaryRange) {
        jobsQuery = jobsQuery
          .gte("salary_min", filters.salaryRange.min)
          .lte("salary_max", filters.salaryRange.max);
      }

      // Apply pagination and ordering
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      jobsQuery = jobsQuery
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, error, count } = await jobsQuery;

      if (error) {
        return rejectWithValue(error.message);
      }

      const transformedJobs = data?.map(transformRawJob) || [];

      // For TA users, mark which jobs they have access to
      if (userRole === "ta" && userId) {
        transformedJobs.forEach((job) => {
          job.has_access = accessibleJobIds.includes(job.id);
          job.access_type = "granted";
        });
      }

      return {
        jobs: transformedJobs,
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch jobs";
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

    setFilters: (state, action: PayloadAction<JobFilters>) => {
      state.filters = action.payload;
      // Apply filters to jobs
      state.filteredJobs = state.jobs.filter((job) => {
        const { status, location, company, jobType, accessibleOnly } =
          action.payload;

        if (status && job.status !== status) return false;
        if (
          location &&
          !job.location?.toLowerCase().includes(location.toLowerCase())
        )
          return false;
        if (
          company &&
          !job.company_name?.toLowerCase().includes(company.toLowerCase())
        )
          return false;
        if (jobType && job.job_type !== jobType) return false;
        if (accessibleOnly && !job.has_access) return false;

        return true;
      });
    },

    clearFilters: (state) => {
      state.filters = {};
      state.filteredJobs = state.jobs;
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
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.filteredJobs = action.payload.jobs;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalCount: action.payload.totalCount,
          pageSize: state.pagination.pageSize,
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
        state.jobs.unshift(action.payload);
        state.filteredJobs.unshift(action.payload);
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
