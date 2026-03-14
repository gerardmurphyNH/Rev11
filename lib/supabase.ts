import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
          total_points: number
          games_played: number
          perfect_scores: number
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          created_at?: string
          total_points?: number
          games_played?: number
          perfect_scores?: number
        }
        Update: {
          display_name?: string | null
          total_points?: number
          games_played?: number
          perfect_scores?: number
        }
      }
      players: {
        Row: {
          id: string
          name: string
          jersey_number: number | null
          position: string | null
          headshot_url: string | null
          is_active: boolean
          last_updated: string
        }
        Insert: {
          id?: string
          name: string
          jersey_number?: number | null
          position?: string | null
          headshot_url?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          jersey_number?: number | null
          position?: string | null
          headshot_url?: string | null
          is_active?: boolean
          last_updated?: string
        }
      }
      matches: {
        Row: {
          id: string
          opponent: string
          match_date: string
          is_home: boolean
          venue: string | null
          competition: string
          match_url: string | null
          status: 'upcoming' | 'locked' | 'completed'
          locked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          opponent: string
          match_date: string
          is_home?: boolean
          venue?: string | null
          competition?: string
          match_url?: string | null
          status?: 'upcoming' | 'locked' | 'completed'
          locked_at?: string | null
        }
        Update: {
          opponent?: string
          match_date?: string
          is_home?: boolean
          venue?: string | null
          competition?: string
          match_url?: string | null
          status?: 'upcoming' | 'locked' | 'completed'
          locked_at?: string | null
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          match_id: string
          submitted_at: string
          updated_at: string
          is_locked: boolean
          points_earned: number | null
          is_perfect: boolean
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          is_locked?: boolean
          points_earned?: number | null
          is_perfect?: boolean
        }
        Update: {
          updated_at?: string
          is_locked?: boolean
          points_earned?: number | null
          is_perfect?: boolean
        }
      }
      prediction_players: {
        Row: {
          id: string
          prediction_id: string
          player_id: string
        }
        Insert: {
          id?: string
          prediction_id: string
          player_id: string
        }
        Update: Record<string, never>
      }
      correct_lineups: {
        Row: {
          id: string
          match_id: string
          confirmed_by: string | null
          confirmed_at: string | null
          status: 'pending' | 'confirmed' | 'error'
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          status?: 'pending' | 'confirmed' | 'error'
        }
        Update: {
          confirmed_by?: string | null
          confirmed_at?: string | null
          status?: 'pending' | 'confirmed' | 'error'
        }
      }
      correct_lineup_players: {
        Row: {
          id: string
          correct_lineup_id: string
          player_id: string
        }
        Insert: {
          id?: string
          correct_lineup_id: string
          player_id: string
        }
        Update: Record<string, never>
      }
      auth_codes: {
        Row: {
          id: string
          email: string
          code: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          code: string
          expires_at: string
          used?: boolean
        }
        Update: {
          used?: boolean
        }
      }
    }
  }
}

function getEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing environment variable: ${key}`)
  return val
}

// Browser client (for client components) - lazy
let _supabase: ReturnType<typeof createClient<Database>> | null = null
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
  }
  return _supabase
}
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  }
})

// Service client (for server-side ops, bypasses RLS) - lazy
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient<Database>(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
  }
  return _supabaseAdmin
}
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop]
  }
})

// Server client with cookie-based auth
export async function createServerSupabase() {
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const cookieStore = await cookies()
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server component - can't set cookies
        }
      },
    },
  })
}
