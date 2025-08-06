import { User } from "@supabase/supabase-js";

export interface UserProfile {
    id: string;
    organization_id: string | null;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: string;
    name: string;
    display_name: string;
    description: string | null;
    permissions: Record<string, boolean | string | number>;
    created_at: string;
}

export interface UserRole {
    id: string;
    role_id: string;
    organization_id: string | null;
    assigned_by: string | null;
    assigned_at: string;
    is_active: boolean;
    role: Role;
    role_organization: Organization | null;
}

export interface CompleteUserData {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
    profile: UserProfile | null;
    organization: Organization | null;
    roles: UserRole[];
}

export interface UserState {
    user: User | null;
    profile: UserProfile | null;
    organization: Organization | null;
    roles: UserRole[];
    completeUserData: CompleteUserData | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface FilterState {
    status: string;
    location: string;
    company: string;
    isOpen: 'status' | 'location' | 'company' | false;
}

export interface JobsClientComponentProps {
    userRole?: string;
    userId?: string;
    organizationId?: string;
}

// Form validation schema
export interface FormErrors {
    companyLogo?: string;
    companyName?: string;
    jobTitle?: string;
    status?: string;
    jobType?: string;
    jobLocationType?: string;
    jobLocation?: string;
    workingType?: string;
    experience?: string;
    minExperience?: string;
    maxExperience?: string;
    salary?: string;
    minSalary?: string;
    maxSalary?: string;
    applicationDeadline?: string;
    jobDescription?: string;
    general?: string;
}

export interface JobFormData {
    companyLogo: File | null;
    companyName: string;
    jobTitle: string;
    jobType: string;
    jobLocationType: string;
    jobLocation: string;
    workingType: string;
    minExperience: string;
    maxExperience: string;
    minSalary: string;
    maxSalary: string;
    jobDescription: string;
    applicationDeadline: string;
    status: string;
}

export interface JobMetadata {
    jobTitle: string;
    jobAdmin: string;
    jobType: string;
    jobLocationType: string;
    jobLocation: string;
    workingType: string;
    experience: { min: string; max: string };
    salary: { min: string; max: string };
    companyName: string;
    jobDescription: string;
    company_logo_url: string;
    status: JobStatus;
}

export type JobStatus = typeof JOB_STATUSES[number];
export const JOB_STATUSES = ["active", "closed", "hold on"] as const;
export const STEPS = ["Job Details", "Candidates", "Settings"] as const;

export interface FormState {
    success: boolean;
    error?: string;
    message?: string;
}