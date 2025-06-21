export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          user_id: string | null
        }
        Insert: {
          access_type?: string | null
          created_at?: string | null
          granted_by?: string | null
          id?: string
          job_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string | null
          created_at?: string | null
          granted_by?: string | null
          id?: string
          job_id?: string | null
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
      [_ in never]: never
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
        }
        Returns: Json
      }
      get_applications_over_time: {
        Args: { user_uuid: string; org_uuid: string; weeks_back?: number }
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
      get_top_performers: {
        Args: {
          user_uuid: string
          org_uuid: string
          metric_type?: string
          limit_count?: number
        }
        Returns: Json
      }
      get_user_role_in_org: {
        Args: { user_uuid: string; org_uuid: string }
        Returns: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
