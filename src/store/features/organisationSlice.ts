import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createClient } from '@/utils/supabase/client';

// Types
export interface JobAccess {
    job_id: string;
    title: string;
    company_name: string;
    status: string;
    access_type: 'all_jobs' | 'assigned';
    granted_by?: string;
    granted_at?: string;
}

// Base job access interface
interface BaseJobAccess {
    job_id: string;
    title: string;
    company_name: string;
    status: string;
}

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

// For admin and hr roles - all jobs access
interface AllJobsAccess extends BaseJobAccess {
    access_type: 'all_jobs';
}

// For ta role - assigned jobs only
interface AssignedJobAccess extends BaseJobAccess {
    access_type: 'assigned';
    granted_by: string;
    granted_at: string; // ISO timestamp
}

type RpcResponseJobAccess = AllJobsAccess | AssignedJobAccess;

interface RpcMemberResponse {
    user_id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    role_id: string;
    role_name: string;
    role_display_name: string;
    assigned_by: string;
    assigned_at: string;
    job_access: RpcResponseJobAccess[] | null; // Fixed: Should be array, not single object
}

interface OrgMemberWithJobs {
    user_id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    role_id: string;
    role_name: string;
    role_display_name: string;
    assigned_by: string;
    assigned_at: string;
    job_access: JobAccess[];
}

interface OrganisationState {
    members: OrgMemberWithJobs[];
    loading: boolean;
    error: string | null;
    lastFetchedOrgId: string | null; // Track which org was last fetched
}

// Initial state
const initialState: OrganisationState = {
    members: [],
    loading: false,
    error: null,
    lastFetchedOrgId: null,
};

const supabase = createClient();

// Type guard to check if job access is valid
const isValidJobAccess = (job: unknown): job is JobAccess => {
    return (
        typeof job === 'object' &&
        job !== null &&
        'job_id' in job &&
        'title' in job &&
        'company_name' in job &&
        'status' in job &&
        'access_type' in job &&
        typeof (job as JobAccess).job_id === 'string' &&
        typeof (job as JobAccess).title === 'string' &&
        typeof (job as JobAccess).company_name === 'string' &&
        typeof (job as JobAccess).status === 'string' &&
        ['all_jobs', 'assigned'].includes((job as JobAccess).access_type)
    );
};

const transformRpcResponseToMember = (rpcData: RpcMemberResponse): OrgMemberWithJobs => {
    let jobAccess: JobAccess[] = [];

    if (Array.isArray(rpcData.job_access)) {
        jobAccess = rpcData.job_access.filter(isValidJobAccess);
    }

    return {
        user_id: rpcData.user_id,
        email: rpcData.email,
        full_name: rpcData.full_name,
        is_active: rpcData.is_active,
        role_id: rpcData.role_id,
        role_name: rpcData.role_name,
        role_display_name: rpcData.role_display_name,
        assigned_by: rpcData.assigned_by,
        assigned_at: rpcData.assigned_at,
        job_access: jobAccess
    };
};

// Async thunks
export const fetchOrgMembers = createAsyncThunk(
    'organisation/fetchMembers',
    async ({ orgId, member_email }: { orgId: string; member_email: string | undefined }, { rejectWithValue }) => {
        try {
            if (!orgId) {
                throw new Error('Organization ID is required');
            }

            const { data, error } = await supabase
                .rpc('fetch_org_members_with_jobs', {
                    org_id: orgId,  
                    member_email: member_email // Optional parameter
                });

            if (error) {
                throw new Error(`Failed to fetch members: ${error.message}`);
            }

            console.log('Fetched members with jobs:', data);

            if (!data) {
                return { members: [], orgId };
            }

            // Type the data properly
            const typedData = data as RpcMemberResponse[];
            const members = typedData.map(transformRpcResponseToMember);
            return { members, orgId };

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            return rejectWithValue(message);
        }
    }
);

export const addMemberRole = createAsyncThunk(
    'organisation/addMember',
    async (
        { memberEmailId, role, organization_id, assigned_by }: {
            memberEmailId: string;
            role: string;
            organization_id: string;
            assigned_by: string;
        },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Validate inputs
            if (!memberEmailId || !role || !organization_id || !assigned_by) {
                throw new Error('All parameters are required');
            }

            // Call the RPC function to assign role
            const { error: rpcError } = await supabase.rpc('assign_user_role', {
                target_email_id: memberEmailId,
                target_organization_id: organization_id,
                target_role_name: role,
                assigner_user_id: assigned_by
            });

            if (rpcError) {
                throw new Error(`Failed to assign role: ${rpcError.message}`);
            }
            dispatch(fetchOrgMembers({ orgId: organization_id, member_email: memberEmailId }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            return rejectWithValue(message);
        }
    }
);

export const updateMemberRole = createAsyncThunk(
    'organisation/updateMember',
    async (
        { memberEmailId, newRole, updated_by, organization_id }: {
            memberEmailId: string;
            newRole: string;
            updated_by: string;
            organization_id: string;
        },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Validate inputs
            if (!memberEmailId || !newRole || !updated_by) {
                throw new Error('All parameters are required');
            }

            // Call the RPC function to update role
            const { error: rpcError } = await supabase.rpc('update_user_role', {
                target_email_id: memberEmailId,
                new_role_name: newRole,
                updater_user_id: updated_by
            });

            if (rpcError) {
                throw new Error(`Failed to update role: ${rpcError.message}`);
            }

            // It can be optimised further by not fetching all members again
            dispatch(fetchOrgMembers({ orgId: organization_id, member_email: memberEmailId }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            return rejectWithValue(message);
        }
    }
);

export const removeMemberRole = createAsyncThunk(
    'organisation/removeMemberRole',
    async (
        { memberUUID, organization_id, removed_by }: {
            memberUUID: string;
            organization_id: string;
            removed_by: string;
        },
        { rejectWithValue }
    ) => {
        try {
            // Validate inputs
            if (!memberUUID || !organization_id || !removed_by) {
                throw new Error('All parameters are required');
            }
            // Call the RPC function to remove role
            const { data, error: rpcError } = await supabase.rpc('remove_member_from_organization', {
                p_user_id: memberUUID,
                p_organization_id: organization_id,
                p_removed_by: removed_by
            });
            if (
                data &&
                typeof data === 'object' &&
                'success' in data &&
                (data as { success?: boolean }).success === false
            ) {
                throw new Error((data as { error?: string }).error || 'Failed to remove member role');
            }

            if (rpcError) {
                throw new Error(`Failed to remove role: ${rpcError.message}`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            return rejectWithValue(message);
        }
    }
);

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

export const transferJobsTA = createAsyncThunk(
    'organisation/transferJobs',
    async (
        { from_user_id, to_user_id, transferredBy, transferredBy_role, organization_id, to_user_email }: { from_user_id: string; to_user_id: string; transferredBy: string; transferredBy_role: string; organization_id: string; to_user_email: string },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Validate inputs
            if (!from_user_id || !to_user_id || !transferredBy || !organization_id || !to_user_email) {
                throw new Error('All parameters are required');
            }
            // only admin and hr can tranfer jobs
            if (transferredBy_role !== 'admin' && transferredBy_role !== 'hr') {
                throw new Error('Only admins and HR can transfer jobs');
            }

            // Call the RPC function to transfer jobs
            const { error: rpcError } = await supabase.rpc('transfer_ta_jobs', {
                p_from_user_id: from_user_id,
                p_to_user_id: to_user_id,
                p_transferred_by: transferredBy,
                p_organization_id: organization_id,
            });

            if (rpcError) {
                throw new Error(`Failed to transfer jobs: ${rpcError.message}`);
            }

            // It can be optimised further by not fetching all members again
            dispatch(fetchOrgMembers({ orgId: organization_id, member_email: to_user_email }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            return rejectWithValue(message);
        }
    }
);

//assign jobs access with job title with the function grant_access_by_job_titles that accepts memberUUid, jobTitle[], grantedBy(uuid)]
export const assignJobAccesswithJob_title = createAsyncThunk(
    'organisation/assignJobAccesswithJob_title',
    async (
        { memberUuid, jobTitles, grantedBy, organization_id, member_email }: { memberUuid: string; jobTitles: string[]; grantedBy: string, organization_id: string, member_email: string },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Validate inputs
            if (!memberUuid || !jobTitles.length || !grantedBy || !organization_id) {
                throw new Error('All parameters are required');
            }

            // Call the RPC function to assign job access
            const { error: rpcError } = await supabase.rpc('grant_access_by_job_titles', {
                p_user_id: memberUuid,
                p_job_titles: jobTitles,
                p_granted_by: grantedBy
            });

            if (rpcError) {
                throw new Error(`Failed to assign job access: ${rpcError.message}`);
            }

            // It can be optimised further by not fetching all members again
            dispatch(fetchOrgMembers({ orgId: organization_id, member_email }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            return rejectWithValue(message);
        }
    }
);

export const assignJobAccessWithCompany = createAsyncThunk(
    'organisation/assignJobAccessWithCompany',
    async (
        { memberUuid, companies, grantedBy, organization_id, member_email }: { memberUuid: string; companies: string[]; grantedBy: string, organization_id: string, member_email: string },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // Validate inputs
            if (!memberUuid || !companies.length || !grantedBy || !organization_id) {
                throw new Error('All parameters are required');
            }

            // Call the RPC function to assign job access
            const { error: rpcError } = await supabase.rpc('grant_access_by_companies', {
                p_user_id: memberUuid,
                p_companies: companies,
                p_granted_by: grantedBy
            });

            if (rpcError) {
                throw new Error(`Failed to assign job access: ${rpcError.message}`);
            }

            // It can be optimised further by not fetching all members again
            dispatch(fetchOrgMembers({ orgId: organization_id, member_email }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            return rejectWithValue(message);
        }
    }
);

// Slice
const organisationSlice = createSlice({
    name: 'organisation',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearMembers: (state) => {
            state.members = [];
            state.lastFetchedOrgId = null;
        },
        // Optimistic update for better UX
        updateMemberOptimistic: (state, action: PayloadAction<{ memberId: string; updates: Partial<OrgMemberWithJobs> }>) => {
            const { memberId, updates } = action.payload;
            const memberIndex = state.members.findIndex(member => member.user_id === memberId);
            if (memberIndex !== -1) {
                state.members[memberIndex] = { ...state.members[memberIndex], ...updates };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch members
            .addCase(fetchOrgMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrgMembers.fulfilled, (state, action) => {
                state.loading = false;
                // if only one member is fetched using member_email, update just that member
                if (action.payload.members.length === 1 && action.payload.members[0].email) {
                    const fetchedMember = action.payload.members[0];
                    const existingMemberIndex = state.members.findIndex(member => member.user_id === fetchedMember.user_id);
                    if (existingMemberIndex !== -1) {
                        // Update existing member
                        state.members[existingMemberIndex] = fetchedMember;
                    } else {
                        // Add new member if not found
                        state.members.push(fetchedMember);
                    }
                } else {
                    // If fetching all members, replace the entire list
                    state.members = action.payload.members;
                    state.lastFetchedOrgId = action.payload.orgId;
                }
            })
            .addCase(fetchOrgMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // add member role
            .addCase(addMemberRole.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addMemberRole.fulfilled, (state) => {
                state.loading = false;
                // The fetchOrgMembers will update the members list
                // No need to modify state.members here as it will be updated by the fetchOrgMembers
            })
            .addCase(addMemberRole.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update member role
            .addCase(updateMemberRole.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(updateMemberRole.fulfilled, (state) => {
                state.loading = false;
                // The fetchOrgMembers will update the members list
            })
            .addCase(updateMemberRole.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Assign job access with job title
            .addCase(assignJobAccesswithJob_title.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(assignJobAccesswithJob_title.fulfilled, (state) => {
                state.loading = false;
                // The fetchOrgMembers will update the members list
            })
            .addCase(assignJobAccesswithJob_title.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Assign job access with company
            .addCase(assignJobAccessWithCompany.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(assignJobAccessWithCompany.fulfilled, (state) => {
                state.loading = false;
                // The fetchOrgMembers will update the members list
            })
            .addCase(assignJobAccessWithCompany.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Remove member role
            .addCase(removeMemberRole.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(removeMemberRole.fulfilled, (state, action) => {
                state.loading = false;
                state.members = state.members.filter(member => member.user_id !== action.meta.arg.memberUUID);
                // The fetchOrgMembers will update the members list
            })
            .addCase(removeMemberRole.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.members = state.members.map(member =>
                    member.user_id === action.meta.arg.memberUUID
                        ? { ...member, is_active: true } // Reset is_active to true if removal failed
                        : member
                );
            })
            // Revoke job access
            .addCase(revokeJobAccess.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(revokeJobAccess.fulfilled, (state, action) => {
                state.loading = false;
                // Update the member's job access in the state
                const memberIndex = state.members.findIndex(member => member.user_id === action.payload.user_id);
                if (memberIndex !== -1) {
                    const updatedMember = { ...state.members[memberIndex] };
                    updatedMember.job_access = updatedMember.job_access.filter(job => job.job_id !== action.payload.job_id);
                    state.members[memberIndex] = updatedMember;
                }
            })
            .addCase(revokeJobAccess.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            //transfer job
            .addCase(transferJobsTA.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(transferJobsTA.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(transferJobsTA.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
    },
});

export const { clearError, clearMembers, updateMemberOptimistic } = organisationSlice.actions;

// Selectors
export const selectMembers = (state: { organisation: OrganisationState }) => state.organisation.members;
export const selectActiveMembers = (state: { organisation: OrganisationState }) =>
    state.organisation.members.filter(member => member.is_active === true);
export const selectMembersByRole = (state: { organisation: OrganisationState }, role: 'admin' | 'hr' | 'ta') =>
    state.organisation.members.filter(member => member.role_name === role);
export const selectOrganisationLoading = (state: { organisation: OrganisationState }) => state.organisation.loading;
export const selectOrganisationError = (state: { organisation: OrganisationState }) => state.organisation.error;

export default organisationSlice.reducer;