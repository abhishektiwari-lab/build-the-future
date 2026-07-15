import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      participants: {
        Row: {
          id: string
          name: string
          email: string
          role: 'participant' | 'judge' | 'moderator'
          team_id: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: string
          team_id?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          email?: string
          role?: string
          team_id?: string | null
          session_id?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          join_code: string
          presentation_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          join_code: string
          presentation_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          join_code?: string
          presentation_order?: number | null
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          team_id: string
          prototype_name: string | null
          current_product_or_process: string | null
          persona: string | null
          job_to_be_done: string | null
          problem: string | null
          ai_native_solution: string | null
          expected_outcomes: string | null
          demo_url: string | null
          supporting_url: string | null
          image_url: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          prototype_name?: string | null
          current_product_or_process?: string | null
          persona?: string | null
          job_to_be_done?: string | null
          problem?: string | null
          ai_native_solution?: string | null
          expected_outcomes?: string | null
          demo_url?: string | null
          supporting_url?: string | null
          image_url?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          prototype_name?: string | null
          current_product_or_process?: string | null
          persona?: string | null
          job_to_be_done?: string | null
          problem?: string | null
          ai_native_solution?: string | null
          expected_outcomes?: string | null
          demo_url?: string | null
          supporting_url?: string | null
          image_url?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
      }
      judges: {
        Row: {
          id: string
          name: string
          access_code: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          access_code: string
          active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          access_code?: string
          active?: boolean
        }
      }
      scores: {
        Row: {
          id: string
          judge_id: string
          team_id: string
          customer_outcome: number
          ai_native_thinking: number
          innovation_and_vision: number
          comment: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          judge_id: string
          team_id: string
          customer_outcome: number
          ai_native_thinking: number
          innovation_and_vision: number
          comment?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          customer_outcome?: number
          ai_native_thinking?: number
          innovation_and_vision?: number
          comment?: string | null
          updated_at?: string
        }
      }
      event_state: {
        Row: {
          id: string
          registration_open: boolean
          submissions_open: boolean
          judging_open: boolean
          judging_locked: boolean
          current_team_id: string | null
          leaderboard_visible: boolean
          winner_reveal_state: 'hidden' | 'top3' | 'full' | 'winner'
          updated_at: string
        }
        Insert: {
          id?: string
          registration_open?: boolean
          submissions_open?: boolean
          judging_open?: boolean
          judging_locked?: boolean
          current_team_id?: string | null
          leaderboard_visible?: boolean
          winner_reveal_state?: string
          updated_at?: string
        }
        Update: {
          registration_open?: boolean
          submissions_open?: boolean
          judging_open?: boolean
          judging_locked?: boolean
          current_team_id?: string | null
          leaderboard_visible?: boolean
          winner_reveal_state?: string
          updated_at?: string
        }
      }
    }
  }
}
