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
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_state: Json | null
          audit_log_id: string
          before_state: Json | null
          created_at: string
          entity_id: string
          entity_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_state?: Json | null
          audit_log_id?: string
          before_state?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_state?: Json | null
          audit_log_id?: string
          before_state?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bracket_qualifications: {
        Row: {
          bracket_qualification_id: string
          created_at: string
          destination_bracket_id: string
          destination_match_id: string
          destination_slot: number
          qualification_rule: string
          resolved_at: string | null
          resolved_registration_id: string | null
          resolved_team_id: string | null
          source_bracket_id: string
          source_placement: number
        }
        Insert: {
          bracket_qualification_id?: string
          created_at?: string
          destination_bracket_id: string
          destination_match_id: string
          destination_slot: number
          qualification_rule?: string
          resolved_at?: string | null
          resolved_registration_id?: string | null
          resolved_team_id?: string | null
          source_bracket_id: string
          source_placement?: number
        }
        Update: {
          bracket_qualification_id?: string
          created_at?: string
          destination_bracket_id?: string
          destination_match_id?: string
          destination_slot?: number
          qualification_rule?: string
          resolved_at?: string | null
          resolved_registration_id?: string | null
          resolved_team_id?: string | null
          source_bracket_id?: string
          source_placement?: number
        }
        Relationships: [
          {
            foreignKeyName: "bracket_qualifications_destination_bracket_id_fkey"
            columns: ["destination_bracket_id"]
            isOneToOne: false
            referencedRelation: "brackets"
            referencedColumns: ["bracket_id"]
          },
          {
            foreignKeyName: "bracket_qualifications_destination_match_id_fkey"
            columns: ["destination_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "bracket_qualifications_resolved_registration_id_fkey"
            columns: ["resolved_registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "bracket_qualifications_resolved_team_id_fkey"
            columns: ["resolved_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "bracket_qualifications_source_bracket_id_fkey"
            columns: ["source_bracket_id"]
            isOneToOne: false
            referencedRelation: "brackets"
            referencedColumns: ["bracket_id"]
          },
        ]
      }
      bracket_slots: {
        Row: {
          bracket_id: string
          bracket_slot_id: string
          is_bye: boolean
          seed: number | null
          team_id: string | null
        }
        Insert: {
          bracket_id: string
          bracket_slot_id?: string
          is_bye?: boolean
          seed?: number | null
          team_id?: string | null
        }
        Update: {
          bracket_id?: string
          bracket_slot_id?: string
          is_bye?: boolean
          seed?: number | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bracket_slots_bracket_id_fkey"
            columns: ["bracket_id"]
            isOneToOne: false
            referencedRelation: "brackets"
            referencedColumns: ["bracket_id"]
          },
          {
            foreignKeyName: "bracket_slots_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      brackets: {
        Row: {
          bracket_id: string
          bracket_size: number
          created_at: string
          format: string
          status: string
          tournament_id: string
        }
        Insert: {
          bracket_id?: string
          bracket_size: number
          created_at?: string
          format?: string
          status?: string
          tournament_id: string
        }
        Update: {
          bracket_id?: string
          bracket_size?: number
          created_at?: string
          format?: string
          status?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brackets_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
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
      disputes: {
        Row: {
          assigned_admin_id: string | null
          created_at: string
          description: string | null
          dispute_id: string
          evidence_urls: string[] | null
          match_id: string
          reason: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          submitted_by_user_id: string
        }
        Insert: {
          assigned_admin_id?: string | null
          created_at?: string
          description?: string | null
          dispute_id?: string
          evidence_urls?: string[] | null
          match_id: string
          reason: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          submitted_by_user_id: string
        }
        Update: {
          assigned_admin_id?: string | null
          created_at?: string
          description?: string | null
          dispute_id?: string
          evidence_urls?: string[] | null
          match_id?: string
          reason?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          submitted_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "disputes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "disputes_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      entitlement_transfers: {
        Row: {
          approved_by_admin_id: string | null
          created_at: string
          entitlement_id: string
          from_user_id: string | null
          reason: string | null
          to_user_id: string
          transfer_id: string
        }
        Insert: {
          approved_by_admin_id?: string | null
          created_at?: string
          entitlement_id: string
          from_user_id?: string | null
          reason?: string | null
          to_user_id: string
          transfer_id?: string
        }
        Update: {
          approved_by_admin_id?: string | null
          created_at?: string
          entitlement_id?: string
          from_user_id?: string | null
          reason?: string | null
          to_user_id?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_transfers_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "entitlement_transfers_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "payout_entitlements"
            referencedColumns: ["entitlement_id"]
          },
          {
            foreignKeyName: "entitlement_transfers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "entitlement_transfers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      match_confirmations: {
        Row: {
          confirmation_id: string
          confirmation_type: string
          confirmed_at: string
          confirmed_by_user_id: string | null
          match_id: string
        }
        Insert: {
          confirmation_id?: string
          confirmation_type: string
          confirmed_at?: string
          confirmed_by_user_id?: string | null
          match_id: string
        }
        Update: {
          confirmation_id?: string
          confirmation_type?: string
          confirmed_at?: string
          confirmed_by_user_id?: string | null
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_confirmations_confirmed_by_user_id_fkey"
            columns: ["confirmed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "match_confirmations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
      match_evidence: {
        Row: {
          evidence_id: string
          file_url: string
          match_id: string
          uploaded_at: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          evidence_id?: string
          file_url: string
          match_id: string
          uploaded_at?: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          evidence_id?: string
          file_url?: string
          match_id?: string
          uploaded_at?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_evidence_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_evidence_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      match_results: {
        Row: {
          map_scores: Json | null
          match_id: string
          match_result_id: string
          series_score: string
          submitted_at: string
          submitted_by_user_id: string
        }
        Insert: {
          map_scores?: Json | null
          match_id: string
          match_result_id?: string
          series_score: string
          submitted_at?: string
          submitted_by_user_id: string
        }
        Update: {
          map_scores?: Json | null
          match_id?: string
          match_result_id?: string
          series_score?: string
          submitted_at?: string
          submitted_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_results_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      matches: {
        Row: {
          bracket_id: string
          bracket_position: number
          created_at: string
          dispute_status: string | null
          loser_team_id: string | null
          match_id: string
          match_number: number
          next_match_id: string | null
          next_match_slot: number | null
          result_type: string | null
          round_name: string | null
          round_number: number
          status: string
          team_1_id: string | null
          team_1_source_match_id: string | null
          team_2_id: string | null
          team_2_source_match_id: string | null
          tournament_id: string
          updated_at: string
          version_number: number
          winner_team_id: string | null
        }
        Insert: {
          bracket_id: string
          bracket_position: number
          created_at?: string
          dispute_status?: string | null
          loser_team_id?: string | null
          match_id?: string
          match_number: number
          next_match_id?: string | null
          next_match_slot?: number | null
          result_type?: string | null
          round_name?: string | null
          round_number: number
          status?: string
          team_1_id?: string | null
          team_1_source_match_id?: string | null
          team_2_id?: string | null
          team_2_source_match_id?: string | null
          tournament_id: string
          updated_at?: string
          version_number?: number
          winner_team_id?: string | null
        }
        Update: {
          bracket_id?: string
          bracket_position?: number
          created_at?: string
          dispute_status?: string | null
          loser_team_id?: string | null
          match_id?: string
          match_number?: number
          next_match_id?: string | null
          next_match_slot?: number | null
          result_type?: string | null
          round_name?: string | null
          round_number?: number
          status?: string
          team_1_id?: string | null
          team_1_source_match_id?: string | null
          team_2_id?: string | null
          team_2_source_match_id?: string | null
          tournament_id?: string
          updated_at?: string
          version_number?: number
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_bracket_id_fkey"
            columns: ["bracket_id"]
            isOneToOne: false
            referencedRelation: "brackets"
            referencedColumns: ["bracket_id"]
          },
          {
            foreignKeyName: "matches_loser_team_id_fkey"
            columns: ["loser_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "matches_team_1_id_fkey"
            columns: ["team_1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_team_1_source_match_id_fkey"
            columns: ["team_1_source_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "matches_team_2_id_fkey"
            columns: ["team_2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_team_2_source_match_id_fkey"
            columns: ["team_2_source_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      payment_entry_allocations: {
        Row: {
          allocation_id: string
          amount_cents: number
          created_at: string
          entry_slot_id: string
          payment_id: string
        }
        Insert: {
          allocation_id?: string
          amount_cents: number
          created_at?: string
          entry_slot_id: string
          payment_id: string
        }
        Update: {
          allocation_id?: string
          amount_cents?: number
          created_at?: string
          entry_slot_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_entry_allocations_entry_slot_id_fkey"
            columns: ["entry_slot_id"]
            isOneToOne: false
            referencedRelation: "registration_entry_slots"
            referencedColumns: ["entry_slot_id"]
          },
          {
            foreignKeyName: "payment_entry_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          payload: Json
          payment_event_id: string
          payment_id: string | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          payload: Json
          payment_event_id?: string
          payment_id?: string | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          payload?: Json
          payment_event_id?: string
          payment_id?: string | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          payer_user_id: string
          payment_id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          payer_user_id: string
          payment_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          payer_user_id?: string
          payment_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_payer_user_id_fkey"
            columns: ["payer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payout_entitlements: {
        Row: {
          created_at: string
          entitlement_id: string
          entry_slot_id: string
          holder_user_id: string
          locked_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entitlement_id?: string
          entry_slot_id: string
          holder_user_id: string
          locked_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entitlement_id?: string
          entry_slot_id?: string
          holder_user_id?: string
          locked_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_entitlements_entry_slot_id_fkey"
            columns: ["entry_slot_id"]
            isOneToOne: true
            referencedRelation: "registration_entry_slots"
            referencedColumns: ["entry_slot_id"]
          },
          {
            foreignKeyName: "payout_entitlements_holder_user_id_fkey"
            columns: ["holder_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payout_line_items: {
        Row: {
          amount_cents: number
          entitlement_id: string
          line_item_id: string
          payout_id: string
        }
        Insert: {
          amount_cents: number
          entitlement_id: string
          line_item_id?: string
          payout_id: string
        }
        Update: {
          amount_cents?: number
          entitlement_id?: string
          line_item_id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_line_items_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "payout_entitlements"
            referencedColumns: ["entitlement_id"]
          },
          {
            foreignKeyName: "payout_line_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["payout_id"]
          },
        ]
      }
      payouts: {
        Row: {
          approved_at: string | null
          approved_by_admin_id: string | null
          created_at: string
          paid_at: string | null
          payout_id: string
          prize_allocation_id: string
          recipient_user_id: string
          status: string
          total_amount_cents: number
        }
        Insert: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          created_at?: string
          paid_at?: string | null
          payout_id?: string
          prize_allocation_id: string
          recipient_user_id: string
          status?: string
          total_amount_cents: number
        }
        Update: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          created_at?: string
          paid_at?: string | null
          payout_id?: string
          prize_allocation_id?: string
          recipient_user_id?: string
          status?: string
          total_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payouts_prize_allocation_id_fkey"
            columns: ["prize_allocation_id"]
            isOneToOne: false
            referencedRelation: "prize_allocations"
            referencedColumns: ["prize_allocation_id"]
          },
          {
            foreignKeyName: "payouts_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prize_allocations: {
        Row: {
          created_at: string
          entry_share_value_cents: number
          placement: number
          placement_prize_cents: number
          prize_allocation_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          entry_share_value_cents: number
          placement: number
          placement_prize_cents: number
          prize_allocation_id?: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          entry_share_value_cents?: number
          placement?: number
          placement_prize_cents?: number
          prize_allocation_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_allocations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      registration_entry_slots: {
        Row: {
          assigned_starter_user_id: string | null
          checkout_lock_expires_at: string | null
          checkout_lock_status: string
          created_at: string
          currency: string
          entitlement_status: string
          entry_fee_amount_cents: number
          entry_slot_id: string
          payer_user_id: string | null
          payment_id: string | null
          payment_status: string
          payout_entitlement_user_id: string | null
          registration_id: string
          slot_number: number
          updated_at: string
        }
        Insert: {
          assigned_starter_user_id?: string | null
          checkout_lock_expires_at?: string | null
          checkout_lock_status?: string
          created_at?: string
          currency?: string
          entitlement_status?: string
          entry_fee_amount_cents: number
          entry_slot_id?: string
          payer_user_id?: string | null
          payment_id?: string | null
          payment_status?: string
          payout_entitlement_user_id?: string | null
          registration_id: string
          slot_number: number
          updated_at?: string
        }
        Update: {
          assigned_starter_user_id?: string | null
          checkout_lock_expires_at?: string | null
          checkout_lock_status?: string
          created_at?: string
          currency?: string
          entitlement_status?: string
          entry_fee_amount_cents?: number
          entry_slot_id?: string
          payer_user_id?: string | null
          payment_id?: string | null
          payment_status?: string
          payout_entitlement_user_id?: string | null
          registration_id?: string
          slot_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_entry_slots_assigned_starter_user_id_fkey"
            columns: ["assigned_starter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "registration_entry_slots_payer_user_id_fkey"
            columns: ["payer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "registration_entry_slots_payout_entitlement_user_id_fkey"
            columns: ["payout_entitlement_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "registration_entry_slots_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      registration_rosters: {
        Row: {
          assigned_role: string
          confirmation_status: string
          created_at: string
          eligibility_status: string
          locked_at: string | null
          registration_id: string
          registration_roster_id: string
          starter_slot_number: number | null
          team_member_id: string
          updated_at: string
        }
        Insert: {
          assigned_role: string
          confirmation_status?: string
          created_at?: string
          eligibility_status?: string
          locked_at?: string | null
          registration_id: string
          registration_roster_id?: string
          starter_slot_number?: number | null
          team_member_id: string
          updated_at?: string
        }
        Update: {
          assigned_role?: string
          confirmation_status?: string
          created_at?: string
          eligibility_status?: string
          locked_at?: string | null
          registration_id?: string
          registration_roster_id?: string
          starter_slot_number?: number | null
          team_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_rosters_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "registration_rosters_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["team_member_id"]
          },
        ]
      }
      season_points: {
        Row: {
          created_at: string
          placement_tier: string
          points: number
          season_id: string
          season_points_id: string
          team_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          placement_tier: string
          points: number
          season_id: string
          season_points_id?: string
          team_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          placement_tier?: string
          points?: number
          season_id?: string
          season_points_id?: string
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_points_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["season_id"]
          },
          {
            foreignKeyName: "season_points_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "season_points_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_at: string | null
          name: string
          season_id: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          name: string
          season_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          name?: string
          season_id?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string
          invitation_id: string
          invited_by_user_id: string
          invited_user_id: string
          platform: string
          responded_at: string | null
          roster_role: string
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          invitation_id?: string
          invited_by_user_id: string
          invited_user_id: string
          platform: string
          responded_at?: string | null
          roster_role: string
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          invitation_id?: string
          invited_by_user_id?: string
          invited_user_id?: string
          platform?: string
          responded_at?: string | null
          roster_role?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
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
      team_statistics: {
        Row: {
          current_win_streak: number
          forfeit_losses: number
          forfeit_wins: number
          longest_win_streak: number
          matches_lost: number
          matches_played: number
          matches_won: number
          runner_up_finishes: number
          team_id: string
          tournaments_entered: number
          tournaments_won: number
          updated_at: string
        }
        Insert: {
          current_win_streak?: number
          forfeit_losses?: number
          forfeit_wins?: number
          longest_win_streak?: number
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          runner_up_finishes?: number
          team_id: string
          tournaments_entered?: number
          tournaments_won?: number
          updated_at?: string
        }
        Update: {
          current_win_streak?: number
          forfeit_losses?: number
          forfeit_wins?: number
          longest_win_streak?: number
          matches_lost?: number
          matches_played?: number
          matches_won?: number
          runner_up_finishes?: number
          team_id?: string
          tournaments_entered?: number
          tournaments_won?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_statistics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
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
      tournament_registrations: {
        Row: {
          checked_in_at: string | null
          created_at: string
          funding_status: string
          registration_id: string
          rules_accepted_at: string | null
          status: string
          team_id: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          funding_status?: string
          registration_id?: string
          rules_accepted_at?: string | null
          status?: string
          team_id: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          funding_status?: string
          registration_id?: string
          rules_accepted_at?: string | null
          status?: string
          team_id?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      tournament_rules: {
        Row: {
          body: string
          created_at: string
          tournament_id: string
          tournament_rules_id: string
          updated_at: string
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          tournament_id: string
          tournament_rules_id?: string
          updated_at?: string
          version?: number
        }
        Update: {
          body?: string
          created_at?: string
          tournament_id?: string
          tournament_rules_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_rules_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
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
          ranking_points_config: Json
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
          ranking_points_config?: Json
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
          ranking_points_config?: Json
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
          maximum_coaches: number
          maximum_managers: number
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
          season_id: string | null
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
          maximum_coaches?: number
          maximum_managers?: number
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
          season_id?: string | null
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
          maximum_coaches?: number
          maximum_managers?: number
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
          season_id?: string | null
          second_place_prize_cents?: number | null
          slug?: string
          starts_at?: string | null
          status?: string
          third_place_prize_cents?: number | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["season_id"]
          },
        ]
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
      current_app_user_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_team_member: { Args: { check_team_id: string }; Returns: boolean }
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
