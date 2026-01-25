export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
        }
        Relationships: []
      }
      fuel_issues: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          generator_id: string
          id: string
          notes: string | null
          quantity_litres: number
          stock_after_issue: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          generator_id: string
          id?: string
          notes?: string | null
          quantity_litres: number
          stock_after_issue?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          generator_id?: string
          id?: string
          notes?: string | null
          quantity_litres?: number
          stock_after_issue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fuel_issues_generator_id_fkey"
            columns: ["generator_id"]
            isOneToOne: false
            referencedRelation: "generators"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_purchases: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          invoice_number: string | null
          notes: string | null
          quantity_litres: number
          rate_per_litre: number
          total_amount: number | null
          vendor: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          invoice_number?: string | null
          notes?: string | null
          quantity_litres: number
          rate_per_litre: number
          total_amount?: number | null
          vendor?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          invoice_number?: string | null
          notes?: string | null
          quantity_litres?: number
          rate_per_litre?: number
          total_amount?: number | null
          vendor?: string | null
        }
        Relationships: []
      }
      fuel_stock: {
        Row: {
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          quantity_litres: number
          updated_at: string
        }
        Insert: {
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          quantity_litres?: number
          updated_at?: string
        }
        Update: {
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          quantity_litres?: number
          updated_at?: string
        }
        Relationships: []
      }
      generators: {
        Row: {
          capacity_kva: number | null
          created_at: string
          created_by: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          generator_id: string | null
          id: string
          initial_fuel_stock: number | null
          initial_hour_reading: number
          is_active: boolean
          location: string | null
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          capacity_kva?: number | null
          created_at?: string
          created_by?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          generator_id?: string | null
          id?: string
          initial_fuel_stock?: number | null
          initial_hour_reading?: number
          is_active?: boolean
          location?: string | null
          name: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          capacity_kva?: number | null
          created_at?: string
          created_by?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          generator_id?: string | null
          id?: string
          initial_fuel_stock?: number | null
          initial_hour_reading?: number
          is_active?: boolean
          location?: string | null
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      hour_meter_readings: {
        Row: {
          closing_hour: number
          created_at: string
          created_by: string | null
          date: string
          generator_id: string
          hours_run: number | null
          id: string
          notes: string | null
          opening_hour: number
        }
        Insert: {
          closing_hour: number
          created_at?: string
          created_by?: string | null
          date: string
          generator_id: string
          hours_run?: number | null
          id?: string
          notes?: string | null
          opening_hour: number
        }
        Update: {
          closing_hour?: number
          created_at?: string
          created_by?: string | null
          date?: string
          generator_id?: string
          hours_run?: number | null
          id?: string
          notes?: string | null
          opening_hour?: number
        }
        Relationships: [
          {
            foreignKeyName: "hour_meter_readings_generator_id_fkey"
            columns: ["generator_id"]
            isOneToOne: false
            referencedRelation: "generators"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_stock_checks: {
        Row: {
          check_date: string
          created_at: string
          created_by: string | null
          fiscal_month: string | null
          fiscal_year: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          notes: string | null
          opening_stock: number
          physical_closing: number
          theoretical_closing: number | null
          total_issues: number
          total_purchases: number
          variance: number | null
        }
        Insert: {
          check_date: string
          created_at?: string
          created_by?: string | null
          fiscal_month?: string | null
          fiscal_year?: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          notes?: string | null
          opening_stock?: number
          physical_closing: number
          theoretical_closing?: number | null
          total_issues?: number
          total_purchases?: number
          variance?: number | null
        }
        Update: {
          check_date?: string
          created_at?: string
          created_by?: string | null
          fiscal_month?: string | null
          fiscal_year?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          notes?: string | null
          opening_stock?: number
          physical_closing?: number
          theoretical_closing?: number | null
          total_issues?: number
          total_purchases?: number
          variance?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_avg_fuel_cost: {
        Args: {
          p_from_date: string
          p_fuel_type: Database["public"]["Enums"]["fuel_type"]
          p_to_date: string
        }
        Returns: number
      }
      get_last_hour_reading: {
        Args: { p_generator_id: string }
        Returns: number
      }
      get_total_fuel_issued: {
        Args: { p_from_date: string; p_generator_id: string; p_to_date: string }
        Returns: number
      }
      get_total_hours: {
        Args: { p_from_date: string; p_generator_id: string; p_to_date: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_api_key_usage: { Args: { p_key_id: string }; Returns: undefined }
      validate_api_key: {
        Args: { p_key_hash: string }
        Returns: {
          key_id: string
          permissions: string[]
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "maintenance" | "operator" | "viewer"
      fuel_type: "diesel" | "petrol"
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
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "maintenance", "operator", "viewer"],
      fuel_type: ["diesel", "petrol"],
    },
  },
} as const
