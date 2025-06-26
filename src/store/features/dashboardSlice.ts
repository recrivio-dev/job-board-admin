// dashboardSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createClient } from '@/utils/supabase/client'; // Adjust path as needed

const supabase = createClient();


// Types
interface DashboardStats {
    user_role: string;
    active_jobs: {
        value: number;
        change: number;
        trend: 'up' | 'down' | 'stable';
    };
    applications_received: {
        value: number;
        change: number;
        trend: 'up' | 'down' | 'stable';
    };
    client_companies: {
        value: number;
        change: number;
        trend: 'up' | 'down' | 'stable';
    };
    total_candidates: {
        value: number;
        change: number;
        trend: 'up' | 'down' | 'stable';
    };
}

interface ChartDataPoint {
    week: string;
    week_start: string;
    applications: number;
    companies: number;
    roles: number;
}

interface TopPerformer {
    name: string;
    value: number;
    percentage: number;
}

interface DashboardData {
    stats: DashboardStats;
    chart_data: ChartDataPoint[];
    top_jobs: TopPerformer[];
    top_companies: TopPerformer[];
    generated_at: string;
}

interface DashboardState {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    data: null,
    loading: false,
    error: null,
};

// Async thunks
export const fetchDashboardData = createAsyncThunk(
    'dashboard/fetchData',
    async ({ userUuid, orgUuid }: { userUuid: string; orgUuid: string }) => {
        const { data, error } = await supabase.rpc('get_complete_dashboard_data', {
            user_uuid: userUuid,
            org_uuid: orgUuid,
        });

        console.warn('Dashboard data fetched:', data);

        if (error) {
            throw new Error(error.message);
        }

        // Handle error responses from the function
        if (data && typeof data === 'object' && 'stats' in data) {
            const errorData = data as { stats?: { error?: boolean; message?: string } };
            if (errorData.stats?.error) {
                throw new Error(errorData.stats.message || 'Access denied');
            }
        }

        return data as unknown as DashboardData;
    }
);

export const fetchDashboardStats = createAsyncThunk(
    'dashboard/fetchStats',
    async ({ userUuid, orgUuid }: { userUuid: string; orgUuid: string }) => {
        const { data, error } = await supabase.rpc('get_dashboard_stats', {
            user_uuid: userUuid,
            org_uuid: orgUuid,
        });

        if (error) {
            throw new Error(error.message);
        }

        if (data && typeof data === 'object' && 'error' in data) {
            const errorData = data as { error?: boolean; message?: string };
            if (errorData.error) {
                throw new Error(errorData.message || 'Access denied');
            }
        }

        return data as unknown as DashboardStats;
    }
);

export const fetchApplicationsOverTime = createAsyncThunk(
    'dashboard/fetchApplicationsOverTime',
    async ({
        userUuid,
        orgUuid,
        weeksBack = 12,
        company_name = undefined,
        job_title = undefined,
    }: {
        userUuid: string;
        orgUuid: string;
        weeksBack?: number;
        company_name?: string;
        job_title?: string;
    }) => {
        const { data, error } = await supabase.rpc('get_applications_over_time', {
            user_uuid: userUuid,
            org_uuid: orgUuid,
            weeks_back: weeksBack,
            company_name,
            job_title,
        });

        if (error) {
            throw new Error(error.message);
        }

        if (data && typeof data === 'object' && 'error' in data) {
            const errorData = data as { error?: boolean; message?: string };
            if (errorData.error) {
                throw new Error(errorData.message || 'Access denied');
            }
        }

        return data as unknown as ChartDataPoint[];
    }
);

export const fetchTopPerformers = createAsyncThunk(
    'dashboard/fetchTopPerformers',
    async ({
        userUuid,
        orgUuid,
        metricType = 'applications',
        limitCount = 10,
    }: {
        userUuid: string;
        orgUuid: string;
        metricType?: 'applications' | 'companies';
        limitCount?: number;
    }) => {
        const { data, error } = await supabase.rpc('get_top_performers', {
            user_uuid: userUuid,
            org_uuid: orgUuid,
            metric_type: metricType,
            limit_count: limitCount,
        });

        if (error) {
            throw new Error(error.message);
        }

        if (data && typeof data === 'object' && 'error' in data) {
            const errorData = data as { error?: boolean; message?: string };
            if (errorData.error) {
                throw new Error(errorData.message || 'Access denied');
            }
        }

        return { type: metricType, data: data as unknown as TopPerformer[] };
    }
);

// Slice
const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        clearDashboard: (state) => {
            state.data = null;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch complete dashboard data
            .addCase(fetchDashboardData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchDashboardData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch dashboard data';
            })
            // Fetch stats only
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                if (state.data) {
                    state.data.stats = action.payload;
                }
            })
            // Fetch chart data only
            .addCase(fetchApplicationsOverTime.fulfilled, (state, action) => {
                if (state.data) {
                    state.data.chart_data = action.payload;
                }
            })
            // Fetch top performers
            .addCase(fetchTopPerformers.fulfilled, (state, action) => {
                if (state.data) {
                    if (action.payload.type === 'applications') {
                        state.data.top_jobs = action.payload.data;
                    } else if (action.payload.type === 'companies') {
                        state.data.top_companies = action.payload.data;
                    }
                }
            });
    },
});

export const { clearDashboard, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;

// Selectors
export const selectDashboardData = (state: { dashboard: DashboardState }) =>
    state.dashboard.data;

export const selectDashboardStats = (state: { dashboard: DashboardState }) =>
    state.dashboard.data?.stats;

export const selectDashboardChartData = (state: { dashboard: DashboardState }) =>
    state.dashboard.data?.chart_data;

export const selectTopJobs = (state: { dashboard: DashboardState }) =>
    state.dashboard.data?.top_jobs;

export const selectTopCompanies = (state: { dashboard: DashboardState }) =>
    state.dashboard.data?.top_companies;

export const selectDashboardLoading = (state: { dashboard: DashboardState }) =>
    state.dashboard.loading;

export const selectDashboardError = (state: { dashboard: DashboardState }) =>
    state.dashboard.error;

export const selectUserRole = (state: { dashboard: DashboardState }) =>
    state.dashboard.data?.stats?.user_role;