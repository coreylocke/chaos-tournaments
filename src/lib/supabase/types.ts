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
    PostgrestVersion: "14.5"
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      discord_accounts: {
        Row: {
          discord_account_id: string
          discord_avatar_url: string | null
          discord_display_name: string | null
          discord_user_id: string
          discord_username: string
          linked_at: string
          user_id: string
        }
        Insert: {
          discord_account_id?: string
          discord_avatar_url?: string | null
          discord_display_name?: string | null
          discord_user_id: string
          discord_username: string
          linked_at?: string
          user_id: string
        }
        Update: {
          discord_account_id?: string
          discord_avatar_url?: string | null
          discord_display_name?: string | null
          discord_user_id?: string
          discord_username?: string
          linked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      team_members: {
        Row: {
          game_username: string | null
          is_active: boolean
          is_confirmed: boolean
          joined_at: string
          platform: string
          removed_at: string | null
          roster_role: string
          team_id: string
          team_member_id: string
          user_id: string
        }
        Insert: {
          game_username?: string | null
          is_active?: boolean
          is_confirmed?: boolean
          joined_at?: string
          platform: string
          removed_at?: string | null
          roster_role: string
          team_id: string
          team_member_id?: string
          user_id: string
        }
        Update: {
          game_username?: string | null
          is_active?: boolean
          is_confirmed?: boolean
          joined_at?: string
          platform?: string
          removed_at?: string | null
          roster_role?: string
          team_id?: string
          team_member_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_user_id: string
          created_at: string
          division: string
          status: string
          team_id: string
          team_logo_url: string | null
          team_name: string
          team_slug: string
          updated_at: string
        }
        Insert: {
          captain_user_id: string
          created_at?: string
          division: string
          status?: string
          team_id?: string
          team_logo_url?: string | null
          team_name: string
          team_slug: string
          updated_at?: string
        }
        Update: {
          captain_user_id?: string
          created_at?: string
          division?: string
          status?: string
          team_id?: string
          team_logo_url?: string | null
          team_name?: string
          team_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_user_id_fkey"
            columns: ["captain_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tournament_settings: {
        Row: {
          allow_payer_to_sponsor_opposing_teams: boolean
          auto_confirmation_enabled: boolean
          auto_confirmation_value_threshold_cents: number | null
          auto_confirmation_window_minutes: number
          double_no_show_policy: string
          operations_fee_percentage: number
          prize_rounding_increment_cents: number
          remainder_allocation_rule: string
          remainder_fallback_rule: string
          seeding_method: string
          tournament_id: string
        }
        Insert: {
          allow_payer_to_sponsor_opposing_teams?: boolean
          auto_confirmation_enabled?: boolean
          auto_confirmation_value_threshold_cents?: number | null
          auto_confirmation_window_minutes?: number
          double_no_show_policy?: string
          operations_fee_percentage?: number
          prize_rounding_increment_cents?: number
          remainder_allocation_rule?: string
          remainder_fallback_rule?: string
          seeding_method?: string
          tournament_id: string
        }
        Update: {
          allow_payer_to_sponsor_opposing_teams?: boolean
          auto_confirmation_enabled?: boolean
          auto_confirmation_value_threshold_cents?: number | null
          auto_confirmation_window_minutes?: number
          double_no_show_policy?: string
          operations_fee_percentage?: number
          prize_rounding_increment_cents?: number
          remainder_allocation_rule?: string
          remainder_fallback_rule?: string
          seeding_method?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_settings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      tournaments: {
        Row: {
          best_of: number
          bracket_size: number | null
          check_in_close_at: string | null
          check_in_open_at: string | null
          created_at: string
          division: string
          entitlement_lock_at: string | null
          entry_fee_per_starting_slot_cents: number
          first_place_prize_cents: number | null
          maximum_reserves: number
          maximum_substitutes: number
          maximum_teams: number | null
          minimum_teams: number
          name: string
          payment_deadline: string | null
          prize_allocation_method: string
          registration_close_at: string | null
          registration_open_at: string | null
          required_starting_players: number
          roster_lock_at: string | null
          second_place_prize_cents: number | null
          slug: string
          starts_at: string | null
          status: string
          third_place_prize_cents: number | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          best_of?: number
          bracket_size?: number | null
          check_in_close_at?: string | null
          check_in_open_at?: string | null
          created_at?: string
          division: string
          entitlement_lock_at?: string | null
          entry_fee_per_starting_slot_cents: number
          first_place_prize_cents?: number | null
          maximum_reserves?: number
          maximum_substitutes?: number
          maximum_teams?: number | null
          minimum_teams?: number
          name: string
          payment_deadline?: string | null
          prize_allocation_method?: string
          registration_close_at?: string | null
          registration_open_at?: string | null
          required_starting_players?: number
          roster_lock_at?: string | null
          second_place_prize_cents?: number | null
          slug: string
          starts_at?: string | null
          status?: string
          third_place_prize_cents?: number | null
          tournament_id?: string
          updated_at?: string
        }
        Update: {
          best_of?: number
          bracket_size?: number | null
          check_in_close_at?: string | null
          check_in_open_at?: string | null
          created_at?: string
          division?: string
          entitlement_lock_at?: string | null
          entry_fee_per_starting_slot_cents?: number
          first_place_prize_cents?: number | null
          maximum_reserves?: number
          maximum_substitutes?: number
          maximum_teams?: number | null
          minimum_teams?: number
          name?: string
          payment_deadline?: string | null
          prize_allocation_method?: string
          registration_close_at?: string | null
          registration_open_at?: string | null
          required_starting_players?: number
          roster_lock_at?: string | null
          second_place_prize_cents?: number | null
          slug?: string
          starts_at?: string | null
          status?: string
          third_place_prize_cents?: number | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          account_status: string
          created_at: string
          email: string | null
          is_admin: boolean
          preferred_platform: string | null
          supabase_auth_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          created_at?: string
          email?: string | null
          is_admin?: boolean
          preferred_platform?: string | null
          supabase_auth_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_status?: string
          created_at?: string
          email?: string | null
          is_admin?: boolean
          preferred_platform?: string | null
          supabase_auth_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
