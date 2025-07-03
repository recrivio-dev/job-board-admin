import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import { createClient } from "@/utils/supabase/client";
import { Tables } from "@/types/supabase";

const supabase = createClient();

// Types from your existing code
export type JobApplication = Tables<"job_applications">;
export type CandidateProfile = Tables<"candidates_profiles">;
export type Job = Tables<"jobs">;
export type Education = Tables<"education">;
export type Experience = Tables<"experience">;

// First, define the type for the raw candidate data from the database function
interface RawCandidateData {
  application_id: string;
  applied_date: string;
  application_status: string;
  created_at: string;
  updated_at: string;
  candidate_id: string;
  auth_id: string;
  candidate_name: string;
  candidate_email: string;
  mobile_number: string;
  address: string;
  gender: string;
  disability: boolean;
  resume_link: string;
  portfolio_url: string;
  linkedin_url: string;
  additional_doc_link: string;
  current_ctc: number;
  expected_ctc: number;
  notice_period: string;
  dob: string;
  job_id: string;
  job_title: string;
  company_name: string;
  job_location: string;
  job_location_type: string;
  job_type: string;
  working_type: string;
  min_experience_needed: number;
  max_experience_needed: number;
  min_salary: number;
  max_salary: number;
  company_logo_url: string;
  job_description: string;
  application_deadline: string;
  job_status: string;
  experience_years: number;
  education: Education[];
  experience: Experience[];
  hasAccess: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
  logo_url?: string;
}

export interface FilterOptionsResponse {
  companies: FilterOption[];
  job_titles: FilterOption[];
  locations?: FilterOption[];
  statuses: string[];
  cached?: boolean;
  success: boolean;
  error?: string;
}

// Enhanced user context type
export interface UserContext {
  userId: string;
  organizationId: string;
  roles: string; // ['admin', 'hr', 'ta']
}

interface DatabaseFunctionResponse {
  candidates: RawCandidateData[];
  total_count: number;
  current_page: number;
  total_pages: number;
  success: boolean;
  error?: string;
}

// Enhanced type for joined data with proper nullable handling
export type CandidateWithApplication = {
  // Application fields
  application_id: string;
  applied_date: string;
  application_status: string;
  created_at: string;
  updated_at: string;

  // Candidate profile fields
  id: string;
  auth_id: string | null;
  name: string;
  candidate_email: string;
  mobile_number: string | null;
  address: string | null;
  gender: string | null;
  disability: boolean | null;
  resume_link: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  additional_doc_link: string | null;
  current_ctc: number | null;
  expected_ctc: number | null;
  notice_period: string | null;
  dob: string | null;

  // Job fields
  job_id: string;
  job_title: string;
  company_name: string | null;
  job_location: string | null;
  job_location_type: string | null;
  job_type: string | null;
  working_type: string | null;
  min_experience_needed: number | null;
  max_experience_needed: number | null;
  min_salary: number | null;
  max_salary: number | null;
  company_logo_url: string | null;
  job_description: string | null;
  application_deadline: string | null;
  job_status: string | null;

  // Related data
  education?: Education[] | null;
  experience?: Experience[] | null;

  // Access control flag
  hasAccess?: boolean;
};

function isDatabaseFunctionResponse(data: unknown): data is DatabaseFunctionResponse {
  return !!(
    data &&
    typeof data === 'object' &&
    'success' in data &&
    'candidates' in data &&
    'total_count' in data &&
    'current_page' in data &&
    'total_pages' in data
  );
}


// Updated CandidateFilters interface (keeping multi-select)
export interface CandidateFilters {
  candidateName?: string;
  status?: string[];         // Multi-select array
  companyName?: string[];    // Multi-select array
  jobTitle?: string[];       // Multi-select array
  minExperience?: number;
  maxExperience?: number;
  dateFrom?: string;
  dateTo?: string;
  jobId?: string;
  sortBy?: 'name' | 'application_status' | 'experience_years' | 'company_name' | 'applied_date' | 'created_at' | 'updated_at' | 'current_ctc' | 'expected_ctc';
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string; // Global search term
}
// Enhanced async thunk with role-based access control
export const fetchJobApplicationsWithAccess = createAsyncThunk(
  "candidates/fetchJobApplicationsWithAccess",
  async (
    {
      filters = {},
      userContext,
      page = 1,
      limit = 50,
    }: {
      filters?: Partial<CandidateFilters>;
      userContext: UserContext;
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const { userId, organizationId, roles } = userContext;

      // Determine user role for the function
      let userRole: string;
      if (roles.includes("admin")) {
        userRole = "admin";
      } else if (roles.includes("hr")) {
        userRole = "hr";
      } else if (roles.includes("ta")) {
        userRole = "ta";
      } else {
        // No valid role, return empty result
        return {
          candidates: [],
          total_count: 0,
          current_page: page,
          total_pages: 0,
          success: true
        };
      }

      // Helper function to handle multi-value filters
      const prepareArrayFilter = (filter: string | string[] | undefined): string[] | undefined => {
        if (!filter) return undefined;
        if (Array.isArray(filter)) {
          // Filter out empty strings and 'All' values
          const cleanedArray = filter.filter(item => item && item.trim() !== '' && item !== 'All');
          return cleanedArray.length > 0 ? cleanedArray : undefined;
        }
        // Single value - convert to array if not 'All' or empty
        if (filter !== 'All' && filter.trim() !== '') {
          return [filter];
        }
        return undefined;
      };

      // Prepare function parameters
      const functionParams = {
        p_user_id: userId,
        p_user_role: userRole,
        p_organization_id: organizationId,
        p_page: page,
        p_limit: limit,
        // Multi-value array parameters
        p_application_status: prepareArrayFilter(filters.status),
        p_company_filter: prepareArrayFilter(filters.companyName),
        p_job_title_filter: prepareArrayFilter(filters.jobTitle),
        // Other parameters remain the same
        p_sort_by: filters.sortBy || 'applied_date',
        p_sort_order: filters.sortOrder || 'desc',
        p_name_filter: filters.candidateName || undefined,
        p_min_experience: filters.minExperience || undefined,
        p_max_experience: filters.maxExperience || undefined,
        p_date_from: filters.dateFrom || undefined,
        p_date_to: filters.dateTo || undefined,
        p_job_id: filters.jobId || undefined
      };

      // Call the PostgreSQL function using Supabase RPC
      const { data, error } = await supabase.rpc(
        'fetch_candidates_with_access',
        functionParams
      );

      if (!isDatabaseFunctionResponse(data)) {
        throw new Error("Invalid response format from database function");
      }

      if (error) {
        console.log("Database function error:", error);
        throw new Error(`Database function failed: ${error.message}`);
      }

      if (!data) {
        return {
          candidates: [],
          total_count: 0,
          current_page: page,
          total_pages: 0,
          success: true
        };
      }

      // Type assertion for the function response
      const functionResponse = data as unknown as DatabaseFunctionResponse;

      // Check if the function returned an error
      if (!functionResponse.success) {
        throw new Error(functionResponse.error || "Database function returned an error");
      }

      // Transform the data from the function to match your expected format
      const transformedCandidates: CandidateWithApplication[] = (functionResponse.candidates as RawCandidateData[]).map((candidate: RawCandidateData) => ({
        // Application fields
        application_id: candidate.application_id,
        applied_date: candidate.applied_date,
        application_status: candidate.application_status,
        created_at: candidate.created_at,
        updated_at: candidate.updated_at,

        // Profile fields
        id: candidate.candidate_id,
        auth_id: candidate.auth_id,
        name: candidate.candidate_name,
        candidate_email: candidate.candidate_email,
        mobile_number: candidate.mobile_number,
        address: candidate.address,
        gender: candidate.gender,
        disability: candidate.disability,
        resume_link: candidate.resume_link,
        portfolio_url: candidate.portfolio_url,
        linkedin_url: candidate.linkedin_url,
        additional_doc_link: candidate.additional_doc_link,
        current_ctc: candidate.current_ctc,
        expected_ctc: candidate.expected_ctc,
        notice_period: candidate.notice_period,
        dob: candidate.dob,

        // Job fields
        job_id: candidate.job_id,
        job_title: candidate.job_title,
        company_name: candidate.company_name,
        job_location: candidate.job_location,
        job_location_type: candidate.job_location_type,
        job_type: candidate.job_type,
        working_type: candidate.working_type,
        min_experience_needed: candidate.min_experience_needed,
        max_experience_needed: candidate.max_experience_needed,
        min_salary: candidate.min_salary,
        max_salary: candidate.max_salary,
        company_logo_url: candidate.company_logo_url,
        job_description: candidate.job_description,
        application_deadline: candidate.application_deadline,
        job_status: candidate.job_status,

        // Calculated fields
        experience_years: candidate.experience_years,

        // Related data - now provided by the function
        education: candidate.education || [],
        experience: candidate.experience || [],

        // Access control
        hasAccess: candidate.hasAccess,
      }));

      return {
        candidates: transformedCandidates,
        total_count: functionResponse.total_count,
        current_page: functionResponse.current_page,
        total_pages: functionResponse.total_pages,
        success: functionResponse.success
      };

    } catch (error) {
      console.log("fetchJobApplicationsWithAccess error:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
);

const isFilterOptionsRPCResponse = (data: unknown): data is FilterOptionsResponse => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    'companies' in obj &&
    'success' in obj &&
    'job_titles' in obj &&
    Array.isArray(obj.companies) &&
    Array.isArray(obj.job_titles)
  );
};

//Fetch filter options for candidates
export const fetchFilterOptions = createAsyncThunk(
  "candidates/fetchFilterOptions",
  async (
    params: {
      userContext: UserContext;
      forceRefresh?: boolean;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { candidates: CandidatesState };

      if (!state.candidates) {
        console.warn('Candidates state not initialized');
        return rejectWithValue('Candidates state not initialized');
      }

      const { filterOptions } = state.candidates;

      // Add safety check for filterOptions
      if (!filterOptions) {
        console.warn('Filter options not initialized, proceeding without cache');
      } else {
        // Check if we should skip fetching (cache for 5 minutes)
        const cacheValid = filterOptions.lastFetched &&
          Date.now() - filterOptions.lastFetched < 5 * 60 * 1000;

        if (!params.forceRefresh && cacheValid && filterOptions.companies.length > 0) {
          return {
            companies: filterOptions.companies,
            jobTitles: filterOptions.jobTitles || [],
            statuses: filterOptions.statuses,
            cached: true,
          };
        }
      }

      const { userId, organizationId, roles } = params.userContext;

      // Validate required parameters
      if (!userId || !roles) {
        return rejectWithValue('Missing required user context parameters');
      }

      // Call the RPC function
      const { data, error } = await supabase.rpc("fetch_filter_options", {
        p_user_id: userId,
        p_user_role: roles,
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
      const defaultStatuses = ["accepted", "pending", "rejected"];

      console.log("Fetched filter options:", data.job_titles);

      return {
        companies: (data.companies || []).sort(),
        jobTitles: (data.job_titles || []).sort(),
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

//apply filters
export const applyFilters = createAsyncThunk(
  "candidates/applyFilters",
  async (
    {
      filters,
      userContext,
      page = 1,
    }: {
      filters: Partial<CandidateFilters>;
      userContext: UserContext;
      page?: number;
    },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      // Validate user context
      const state = getState() as { candidates: CandidatesState };
      const currentPageSize = state.candidates.pagination.candidatesPerPage;
      const targetPage = page || 1;

      // Set filters in the state
      dispatch(setFilters(filters));

      // If page is not specified and filters changed, reset to page 1
      if (!page) {
        dispatch(setCurrentPage(1));
      }

      // Dispatch the fetchJobApplicationsWithAccess thunk and unwrap the result
      const response = await dispatch(fetchJobApplicationsWithAccess({
        filters,
        userContext,
        page: targetPage,
        limit: currentPageSize,
      })).unwrap();

      return response;

    } catch (error) {
      console.log("applyFilters error:", error);

      // Return a rejected value that matches the expected response format
      return rejectWithValue({
        candidates: [],
        total_count: 0,
        current_page: page,
        total_pages: 0,
        success: false,
        error: error instanceof Error ? error.message : "Failed to apply filters",
      });
    }
  }
);

//go to page
export const goToPage = createAsyncThunk(
  "jobs/goToPage",
  async (
    params: {
      page: number;
      userContext: UserContext;
    },
    { dispatch, getState }
  ) => {
    const state = getState() as { candidates: CandidatesState };
    const { filters, pagination } = state.candidates;

    // Update current page
    dispatch(setCurrentPage(params.page));

    // Fetch jobs for the new page with current filters
    return dispatch(fetchJobApplicationsWithAccess({
      page: params.page,
      limit: pagination.candidatesPerPage,
      filters,
      userContext: params.userContext,
    }));
  }
);

// Helper function to check if user can access a specific job
export const checkJobAccess = createAsyncThunk(
  "candidates/checkJobAccess",
  async (
    { jobId, userContext }: { jobId: string; userContext: UserContext },
    { rejectWithValue }
  ) => {
    try {
      const { userId, roles } = userContext;

      // Admin and HR have access to all jobs
      if (roles.includes("admin") || roles.includes("hr")) {
        return { jobId, hasAccess: true };
      }

      // For TA, check job_access_control table
      if (roles.includes("ta")) {
        const { data, error } = await supabase
          .from("job_access_control")
          .select("access_type")
          .eq("job_id", jobId)
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found"
          throw new Error(`Failed to check job access: ${error.message}`);
        }

        return {
          jobId,
          hasAccess: data?.access_type === "granted" || false,
        };
      }

      return { jobId, hasAccess: false };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to check job access"
      );
    }
  }
);

// Enhanced async thunk to update application status with access control
export const updateApplicationStatusWithAccess = createAsyncThunk(
  "candidates/updateApplicationStatusWithAccess",
  async (
    {
      applicationId,
      status,
      userContext,
    }: {
      applicationId: string;
      status: string;
      userContext: UserContext;
    },
    { rejectWithValue }
  ) => {
    try {
      const { userId, roles } = userContext;

      // Check if user has permission to update application status
      if (
        !roles.includes("admin") &&
        !roles.includes("hr") &&
        !roles.includes("ta")
      ) {
        throw new Error(
          "Insufficient permissions to update application status"
        );
      }

      // For TA, check if they have access to the specific job
      if (
        roles.includes("ta") &&
        !roles.includes("admin") &&
        !roles.includes("hr")
      ) {
        // First get the job_id for this application
        const { data: appData, error: appError } = await supabase
          .from("job_applications")
          .select("job_id")
          .eq("id", applicationId)
          .single();

        if (appError) {
          throw new Error(`Failed to fetch application: ${appError.message}`);
        }

        // Check if TA has access to this job
        const { data: accessData, error: accessError } = await supabase
          .from("job_access_control")
          .select("access_type")
          .eq("job_id", appData.job_id)
          .eq("user_id", userId)
          .single();

        if (accessError && accessError.code !== "PGRST116") {
          throw new Error(`Failed to check job access: ${accessError.message}`);
        }

        if (!accessData || accessData.access_type !== "granted") {
          throw new Error("You do not have access to update this application");
        }
      }

      // Validate status
      const validStatuses = ["pending", "accepted", "rejected"];
      const normalizedStatus = status.toLowerCase();

      if (!validStatuses.includes(normalizedStatus)) {
        throw new Error(
          `Invalid status: ${status}. Must be one of: ${validStatuses.join(
            ", "
          )}`
        );
      }

      const { data, error } = await supabase
        .from("job_applications")
        .update({
          application_status: normalizedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
        .select("id, application_status, updated_at")
        .single();

      if (error) {
        throw new Error(
          `Failed to update application status: ${error.message}`
        );
      }

      if (!data) {
        throw new Error("No data returned from update operation");
      }

      return {
        applicationId: data.id,
        status: data.application_status,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.log("updateApplicationStatusWithAccess error:", error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update application status"
      );
    }
  }
);

//Enhaced async thunk for deleting a candidate application
export const deleteCandidateApplication = createAsyncThunk(
  "candidates/deleteCandidateApplication",
  async (applicationId: string, { rejectWithValue, getState }) => {
    const state = getState() as RootState;
    const userContext = state.candidates.userContext;

    if (!userContext) {
      return rejectWithValue("User context is not available");
    }

    console.log("deleteCandidateApplication called with:", applicationId);

    //only admin and hr can delete applications
    if (!userContext.roles.includes("admin") && !userContext.roles.includes("hr")) {
      return rejectWithValue("You do not have permission to delete applications");
    }

    try {
      const response = await supabase
        .from("job_applications")
        .delete()
        .eq("id", applicationId)
        .single();

      if (response.error) {
        throw new Error(`Failed to delete application: ${response.error.message}`);
      }

      return applicationId;
    } catch (error) {
      console.log("deleteCandidateApplication error:", error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to delete candidate application"
      );
    }
  }
);

// Enhanced state interface
interface CandidatesState {
  // Core data
  candidates: CandidateWithApplication[];
  currentCandidate: CandidateWithApplication | null;

  // Loading and error states
  loading: boolean;
  error: string | null;

  // Filters (aligned with your function)
  filters: CandidateFilters;

  // Pagination (matches DatabaseFunctionResponse)
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCandidates: number; // Maps to total_count from function
    candidatesPerPage: number; // Maps to limit parameter
  };

  // Filter options
  filterOptions: {
    companies: FilterOption[];
    jobTitles: FilterOption[];
    statuses: string[];
    lastFetched: number | null; // Timestamp of last fetch
    loading?: boolean; // Optional loading state for filter options
    error?: string | null; // Optional error state for filter options
  };

  // Metadata
  lastFetched: string | null;
  userContext: UserContext | null;

  // Access control for TA users
  accessibleJobs: string[];
}


const initialState: CandidatesState = {
  // Core data
  candidates: [],
  currentCandidate: null,

  // Loading and error states
  loading: false,
  error: null,

  // Filters (using default values that match your function)
  filters: {
    status: [], // Will be filtered out in function if "All"
    candidateName: undefined,
    companyName: undefined,
    minExperience: undefined,
    maxExperience: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    jobId: undefined,
    sortBy: 'applied_date', // Matches default in your function
    sortOrder: 'desc', // Matches default in your function
  },

  // Filter options
  filterOptions: {
    companies: [],
    jobTitles: [],
    statuses: ["All", "Accepted", "Rejected", "Pending"], // Default statuses
    lastFetched: null, // Timestamp of last fetch
  },

  // Pagination (matches your function defaults)
  pagination: {
    currentPage: 1, // Matches default page = 1
    totalPages: 0,
    totalCandidates: 0,
    candidatesPerPage: 50, // Matches default limit = 50
  },
  // Metadata
  lastFetched: null,
  userContext: null,

  // Access control
  accessibleJobs: [],
};


const candidatesSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {
    setUserContext: (state, action) => {
      state.userContext = action.payload;
    },

    setCurrentCandidate: (state, action) => {
      const applicationId = action.payload;
      const candidate = state.candidates.find(
        (c) => c.application_id === applicationId
      );
      state.currentCandidate = candidate || null;
    },

    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
    },

    setFilters: (state, action: PayloadAction<CandidateFilters>) => {
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
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    setPagination: (state, action) => {
      const newPagination = { ...state.pagination, ...action.payload };
      newPagination.hasNextPage =
        newPagination.currentPage < newPagination.totalPages;
      newPagination.hasPreviousPage = newPagination.currentPage > 1;
      state.pagination = newPagination;
    },

    updateApplicationStatusInList: (state, action) => {
      const { applicationId, status, updatedAt } = action.payload;

      // Update in candidates list
      const candidateIndex = state.candidates.findIndex(
        (c) => c.application_id === applicationId
      );
      if (candidateIndex !== -1) {
        state.candidates[candidateIndex].application_status = status;
        state.candidates[candidateIndex].updated_at = updatedAt;
      }

      // Update current candidate if it matches
      if (
        state.currentCandidate &&
        state.currentCandidate.application_id === applicationId
      ) {
        state.currentCandidate.application_status = status;
        state.currentCandidate.updated_at = updatedAt;
      }
    },

    setAccessibleJobs: (state, action) => {
      state.accessibleJobs = action.payload;
    },

    // Pagination actions
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.candidatesPerPage = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when changing page size
    },

    setCandidatesPerPage: (state, action) => {
      state.pagination.candidatesPerPage = action.payload;
      state.pagination.currentPage = 1; // Reset to first page when changing page size
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch job applications with access control
      .addCase(fetchJobApplicationsWithAccess.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobApplicationsWithAccess.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload.candidates;
        state.lastFetched = new Date().toISOString();
        state.error = null;

        // Update pagination info
        state.pagination.totalCandidates = action.payload.total_count;
        state.pagination.currentPage = action.payload.current_page;
        state.pagination.totalPages = action.payload.total_pages;
      })
      .addCase(fetchJobApplicationsWithAccess.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.candidates = [];
      })

      // Update application status with access control
      .addCase(updateApplicationStatusWithAccess.pending, (state) => {
        state.error = null;
      })
      .addCase(updateApplicationStatusWithAccess.fulfilled, (state, action) => {
        candidatesSlice.caseReducers.updateApplicationStatusInList(
          state,
          action
        );
      })
      .addCase(updateApplicationStatusWithAccess.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Check job access
      .addCase(checkJobAccess.fulfilled, (state, action) => {
        const { jobId, hasAccess } = action.payload;
        if (hasAccess && !state.accessibleJobs.includes(jobId)) {
          state.accessibleJobs.push(jobId);
        }
      })

      // Delete candidate application
      .addCase(deleteCandidateApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCandidateApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const applicationId = action.payload;
        state.candidates = state.candidates.filter(
          (candidate) => candidate.id !== applicationId
        );
      })
      .addCase(deleteCandidateApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch filter options
      .addCase(fetchFilterOptions.pending, (state) => {
        state.filterOptions.loading = true;
        state.filterOptions.error = null;
      })
      .addCase(fetchFilterOptions.fulfilled, (state, action) => {
        state.filterOptions.loading = false;
        state.filterOptions.error = null;
        state.filterOptions = {
          companies: action.payload.companies,
          jobTitles: action.payload.jobTitles,
          statuses: action.payload.statuses,
          lastFetched: Date.now(),
        };
      })
      .addCase(fetchFilterOptions.rejected, (state, action) => {
        state.filterOptions.loading = false;
        state.filterOptions.error = action.payload as string;
        // Optionally reset filter options on error
        state.filterOptions = {
          companies: [],
          jobTitles: [],
          statuses: ["accepted", "rejected", "pending"], // Default statuses
          lastFetched: null,
        };
      })
      // Apply filters
      .addCase(applyFilters.pending, () => {
        // Don't set main loading to true for filter applications
        // This prevents UI flicker
      })
      .addCase(applyFilters.fulfilled, () => {
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
  setUserContext,
  setCurrentCandidate,
  clearCurrentCandidate,
  setFilters,
  clearFilters,
  setLoading,
  clearFilterOptionsCache,
  clearError,
  setPagination,
  setPageSize,
  updateApplicationStatusInList,
  setAccessibleJobs,
  setCurrentPage,
  setCandidatesPerPage,
} = candidatesSlice.actions;

// Enhanced selectors with proper typing
type RootState = { candidates: CandidatesState };

// Basic selectors
export const selectCandidates = (state: RootState) =>
  state.candidates.candidates;
export const selectCurrentCandidate = (state: RootState) =>
  state.candidates.currentCandidate;
export const selectCandidatesLoading = (state: RootState) =>
  state.candidates.loading;
export const selectCandidatesError = (state: RootState) =>
  state.candidates.error;
export const selectFilters = (state: RootState) => state.candidates.filters;
export const selectPagination = (state: RootState) =>
  state.candidates.pagination;
export const selectLastFetched = (state: RootState) =>
  state.candidates.lastFetched;
export const selectUserContext = (state: RootState) =>
  state.candidates.userContext;
export const selectAccessibleJobs = (state: RootState) =>
  state.candidates.accessibleJobs;
export const selectFilterOptions = (state: RootState) =>
  state.candidates.filterOptions;

// Role-based access selectors
export const selectUserRoles = (state: RootState) =>
  state.candidates.userContext?.roles || [];

export default candidatesSlice.reducer;
