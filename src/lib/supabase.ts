import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { publicEnv } from './env'

const url = publicEnv('SUPABASE_URL')
const anonKey = publicEnv('SUPABASE_ANON_KEY')

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null
