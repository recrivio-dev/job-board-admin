export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      candidate_education_templates: {
        Row: {
          base_profile_id: string
          college_university: string
          created_at: string | null
          degree: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          is_current: boolean | null
          start_date: string | null
          template_name: string
        }
        Insert: {
          base_profile_id: string
          college_university: string
          created_at?: string | null
          degree?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean | null
          start_date?: string | null
          template_name: string
        }
        Update: {
          base_profile_id?: string
          college_university?: string
          created_at?: string | null
          degree?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean | null
          start_date?: string | null
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_education_templates_base_profile_id_fkey"
            columns: ["base_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications_view"
            referencedColumns: ["base_profile_id"]
          },
          {
            foreignKeyName: "candidate_education_templates_base_profile_id_fkey"
            columns: ["base_profile_id"]
            isOneToOne: false
            referencedRelation: "candidates_base_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_experience_templates: {
        Row: {
          base_profile_id: string
          company_name: string
          created_at: string | null
          currently_working: boolean | null
          end_date: string | null
          id: string
          job_title: string
          key_skills: string[] | null
          start_date: string
          template_name: string
        }
        Insert: {
          base_profile_id: string
          company_name: string
          created_at?: string | null
          currently_working?: boolean | null
          end_date?: string | null
          id?: string
          job_title: string
          key_skills?: string[] | null
          start_date: string
          template_name: string
        }
        Update: {
          base_profile_id?: string
          company_name?: string
          created_at?: string | null
          currently_working?: boolean | null
          end_date?: string | null
          id?: string
          job_title?: string
          key_skills?: string[] | null
          start_date?: string
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_experience_templates_base_profile_id_fkey"
            columns: ["base_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications_view"
            referencedColumns: ["base_profile_id"]
          },
          {
            foreignKeyName: "candidate_experience_templates_base_profile_id_fkey"
            columns: ["base_profile_id"]
            isOneToOne: false
            referencedRelation: "candidates_base_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates_base_profile: {
        Row: {
          address: string | null
          auth_id: string | null
          candidate_email: string
          created_at: string | null
          disability: string | null
          dob: string | null
          gender: string | null
          id: string
          is_authenticated: boolean | null
          linkedin_url: string | null
          mobile_number: string | null
          name: string
          portfolio_url: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          auth_id?: string | null
          candidate_email: string
          created_at?: string | null
          disability?: string | null
          dob?: string | null
          gender?: string | null
          id?: string
          is_authenticated?: boolean | null
          linkedin_url?: string | null
          mobile_number?: string | null
          name?: string
          portfolio_url?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          auth_id?: string | null
          candidate_email?: string
          created_at?: string | null
          disability?: string | null
          dob?: string | null
          gender?: string | null
          id?: string
          is_authenticated?: boolean | null
          linkedin_url?: string | null
          mobile_number?: string | null
          name?: string
          portfolio_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      candidates_profiles: {
        Row: {
          additional_doc_link: string | null
          address: string | null
          auth_id: string | null
          candidate_email: string
          created_at: string | null
          current_ctc: number | null
          disability: boolean | null
          dob: string | null
          expected_ctc: number | null
          gender: string | null
          id: string
          linkedin_url: string | null
          mobile_number: string | null
          name: string
          notice_period: string | null
          portfolio_url: string | null
          resume_link: string | null
          updated_at: string | null
        }
        Insert: {
          additional_doc_link?: string | null
          address?: string | null
          auth_id?: string | null
          candidate_email: string
          created_at?: string | null
          current_ctc?: number | null
          disability?: boolean | null
          dob?: string | null
          expected_ctc?: number | null
          gender?: string | null
          id?: string
          linkedin_url?: string | null
          mobile_number?: string | null
          name?: string
          notice_period?: string | null
          portfolio_url?: string | null
          resume_link?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_doc_link?: string | null
          address?: string | null
          auth_id?: string | null
          candidate_email?: string
          created_at?: string | null
          current_ctc?: number | null
          disability?: boolean | null
          dob?: string | null
          expected_ctc?: number | null
          gender?: string | null
          id?: string
          linkedin_url?: string | null
          mobile_number?: string | null
          name?: string
          notice_period?: string | null
          portfolio_url?: string | null
          resume_link?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          college_university: string
          degree: string | null
          end_date: string | null
          field_of_study: string | null
          grade_percentage: number | null
          id: string
          is_current: boolean | null
          profile_id: string
          start_date: string | null
        }
        Insert: {
          college_university: string
          degree?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade_percentage?: number | null
          id?: string
          is_current?: boolean | null
          profile_id: string
          start_date?: string | null
        }
        Update: {
          college_university?: string
          degree?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade_percentage?: number | null
          id?: string
          is_current?: boolean | null
          profile_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "candidates_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experience: {
        Row: {
          company_name: string
          currently_working: boolean | null
          end_date: string | null
          experience_id: string
          job_title: string
          job_type: string | null
          profile_id: string
          start_date: string
        }
        Insert: {
          company_name: string
          currently_working?: boolean | null
          end_date?: string | null
          experience_id?: string
          job_title: string
          job_type?: string | null
          profile_id: string
          start_date: string
        }
        Update: {
          company_name?: string
          currently_working?: boolean | null
          end_date?: string | null
          experience_id?: string
          job_title?: string
          job_type?: string | null
          profile_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "candidates_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_access_control: {
        Row: {
          access_type: string | null
          created_at: string | null
          granted_by: string | null
          id: string
          job_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_type?: string | null
          created_at?: string | null
          granted_by?: string | null
          id?: string
          job_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string | null
          created_at?: string | null
          granted_by?: string | null
          id?: string
          job_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_access_control_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_access_control_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications_view"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_access_control_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_access_control_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_application_education: {
        Row: {
          application_profile_id: string
          college_university: string
          created_at: string | null
          degree: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          is_current: boolean | null
          start_date: string | null
        }
        Insert: {
          application_profile_id: string
          college_university: string
          created_at?: string | null
          degree?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean | null
          start_date?: string | null
        }
        Update: {
          application_profile_id?: string
          college_university?: string
          created_at?: string | null
          degree?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_application_education_application_profile_id_fkey"
            columns: ["application_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications_view"
            referencedColumns: ["application_profile_id"]
          },
          {
            foreignKeyName: "job_application_education_application_profile_id_fkey"
            columns: ["application_profile_id"]
            isOneToOne: false
            referencedRelation: "job_application_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_application_experience: {
        Row: {
          application_profile_id: string
          company_name: string
          created_at: string | null
          currently_working: boolean | null
          end_date: string | null
          id: string
          job_title: string
          key_skills: string[] | null
          start_date: string
        }
        Insert: {
          application_profile_id: string
          company_name: string
          created_at?: string | null
          currently_working?: boolean | null
          end_date?: string | null
          id?: string
          job_title: string
          key_skills?: string[] | null
          start_date: string
        }
        Update: {
          application_profile_id?: string
          company_name?: string
          created_at?: string | null
          currently_working?: boolean | null
          end_date?: string | null
          id?: string
          job_title?: string
          key_skills?: string[] | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_application_experience_application_profile_id_fkey"
            columns: ["application_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications_view"
            referencedColumns: ["application_profile_id"]
          },
          {
            foreignKeyName: "job_application_experience_application_profile_id_fkey"
            columns: ["application_profile_id"]
            isOneToOne: false
            referencedRelation: "job_application_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_application_profiles: {
        Row: {
          additional_doc_link: string | null
          application_status: string
          applied_date: string
          base_profile_id: string
          created_at: string | null
          current_ctc: number | null
          expected_ctc: number | null
          id: string
          job_id: string
          notice_period: string | null
          resume_link: string | null
          updated_at: string | null
        }
        Insert: {
          additional_doc_link?: string | null
          application_status?: string
          applied_date?: string
          base_profile_id: string
          created_at?: string | null
          current_ctc?: number | null
          expected_ctc?: number | null
          id?: string
          job_id: string
          notice_period?: string | null
          resume_link?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_doc_link?: string | null
          application_status?: string
          applied_date?: string
          base_profile_id?: string
          created_at?: string | null
          current_ctc?: number | null
          expected_ctc?: number | null
          id?: string
          job_id?: string
          notice_period?: string | null
          resume_link?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_application_profiles_base_profile_id_fkey"
            columns: ["base_profile_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications_view"
            referencedColumns: ["base_profile_id"]
          },
          {
            foreignKeyName: "job_application_profiles_base_profile_id_fkey"
            columns: ["base_profile_id"]
            isOneToOne: false
            referencedRelation: "candidates_base_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_application_profiles_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications_view"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_application_profiles_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          application_status: string
          applied_date: string
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          updated_at: string
        }
        Insert: {
          application_status?: string
          applied_date?: string
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          updated_at?: string
        }
        Update: {
          application_status?: string
          applied_date?: string
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "candidate_applications_view"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          company_logo_url: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          job_location_type: string | null
          job_type: string | null
          location: string | null
          max_experience_needed: number | null
          min_experience_needed: number | null
          organization_id: string | null
          salary_max: number | null
          salary_min: number | null
          status: string | null
          title: string
          updated_at: string | null
          working_type: string | null
        }
        Insert: {
          application_deadline?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          job_location_type?: string | null
          job_type?: string | null
          location?: string | null
          max_experience_needed?: number | null
          min_experience_needed?: number | null
          organization_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          working_type?: string | null
        }
        Update: {
          application_deadline?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          job_location_type?: string | null
          job_type?: string | null
          location?: string | null
          max_experience_needed?: number | null
          min_experience_needed?: number | null
          organization_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          working_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      candidate_applications_view: {
        Row: {
          application_profile_id: string | null
          application_status: string | null
          applied_date: string | null
          auth_id: string | null
          base_profile_id: string | null
          candidate_email: string | null
          company_name: string | null
          current_ctc: number | null
          expected_ctc: number | null
          is_authenticated: boolean | null
          job_id: string | null
          job_title: string | null
          location: string | null
          name: string | null
          notice_period: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_user_role: {
        Args: {
          target_email_id: string
          target_organization_id: string
          target_role_name: string
          assigner_user_id: string
        }
        Returns: boolean
      }
      delete_application_with_access: {
        Args: {
          p_application_id: string
          p_user_id: string
          p_user_role: string
          p_organization_id?: string
        }
        Returns: Json
      }
      fetch_candidates_with_access: {
        Args: {
          p_user_id: string
          p_user_role: string
          p_organization_id?: string
          p_page?: number
          p_limit?: number
          p_application_status?: string[]
          p_sort_by?: string
          p_sort_order?: string
          p_name_filter?: string
          p_company_filter?: string[]
          p_job_title_filter?: string[]
          p_min_experience?: number
          p_max_experience?: number
          p_date_from?: string
          p_date_to?: string
          p_job_id?: string
          p_search_term?: string
        }
        Returns: Json
      }
      fetch_filter_options: {
        Args: {
          p_user_id: string
          p_user_role: string
          p_organization_id?: string
        }
        Returns: Json
      }
      fetch_jobs_with_access: {
        Args: {
          p_user_id: string
          p_user_role: string
          p_organization_id?: string
          p_page?: number
          p_limit?: number
          p_status?: string
          p_location?: string
          p_company?: string
          p_job_type?: string
          p_salary_min?: number
          p_salary_max?: number
          p_experience_min?: number
          p_experience_max?: number
          p_sort_by?: string
          p_sort_order?: string
          p_search_term?: string
          p_status_filter?: string[]
          p_location_filter?: string[]
          p_company_filter?: string[]
          p_job_type_filter?: string[]
          p_working_type_filter?: string[]
          p_date_from?: string
          p_date_to?: string
        }
        Returns: Json
      }
      fetch_org_members_with_jobs: {
        Args: { org_id: string }
        Returns: {
          user_id: string
          email: string
          full_name: string
          is_active: boolean
          role_id: string
          role_name: string
          role_display_name: string
          assigned_by: string
          assigned_at: string
          job_access: Json
        }[]
      }
      get_applications_over_time: {
        Args: {
          user_uuid: string
          org_uuid: string
          weeks_back?: number
          company_name?: string
          job_title?: string
        }
        Returns: Json
      }
      get_complete_dashboard_data: {
        Args: { user_uuid: string; org_uuid: string }
        Returns: Json
      }
      get_current_user_with_profile: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_dashboard_stats: {
        Args: { user_uuid: string; org_uuid: string }
        Returns: Json
      }
      get_job_details: {
        Args: { job_id: string }
        Returns: {
          id: string
          organization_id: string
          title: string
          description: string
          company_name: string
          company_logo_url: string
          location: string
          job_location_type: string
          job_type: string
          working_type: string
          salary_min: number
          salary_max: number
          status: string
          application_deadline: string
          min_experience_needed: number
          max_experience_needed: number
          created_by: string
          created_at: string
          updated_at: string
          total_applicants: number
        }[]
      }
      get_top_performers: {
        Args: {
          user_uuid: string
          org_uuid: string
          metric_type?: string
          limit_count?: number
        }
        Returns: Json
      }
      get_user_applications: {
        Args: { p_auth_id?: string; p_candidate_email?: string }
        Returns: Json
      }
      get_user_profile_data: {
        Args: { p_auth_id?: string; p_candidate_email?: string }
        Returns: Json
      }
      get_user_role_in_org: {
        Args: { user_uuid: string; org_uuid: string }
        Returns: string
      }
      grant_access_by_companies: {
        Args: { p_user_id: string; p_companies: string[]; p_granted_by: string }
        Returns: boolean
      }
      grant_access_by_job_titles: {
        Args: {
          p_user_id: string
          p_job_titles: string[]
          p_granted_by: string
        }
        Returns: boolean
      }
      link_applications_to_user: {
        Args: { p_auth_id: string; p_candidate_email: string }
        Returns: Json
      }
      new_fetch_candidates_with_access: {
        Args: {
          p_user_id: string
          p_user_role: string
          p_organization_id?: string
          p_page?: number
          p_limit?: number
          p_application_status?: string[]
          p_sort_by?: string
          p_sort_order?: string
          p_name_filter?: string
          p_company_filter?: string[]
          p_job_title_filter?: string[]
          p_min_experience?: number
          p_max_experience?: number
          p_date_from?: string
          p_date_to?: string
          p_job_id?: string
          p_search_term?: string
        }
        Returns: Json
      }
      submit_job_application: {
        Args: {
          p_job_id: string
          p_candidate_email: string
          p_name: string
          p_auth_id?: string
          p_mobile_number?: string
          p_dob?: string
          p_address?: string
          p_linkedin_url?: string
          p_portfolio_url?: string
          p_gender?: string
          p_disability?: string
          p_current_ctc?: number
          p_expected_ctc?: number
          p_notice_period?: string
          p_resume_link?: string
          p_additional_doc_link?: string
          p_education_data?: Json
          p_experience_data?: Json
        }
        Returns: Json
      }
      update_application_status_with_access: {
        Args: {
          p_application_id: string
          p_status: string
          p_user_id: string
          p_user_role: string
          p_organization_id?: string
        }
        Returns: Json
      }
      update_user_role: {
        Args: {
          target_email_id: string
          new_role_name: string
          updater_user_id: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: {
          check_user_id: string
          check_organization_id: string
          check_role_name: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
