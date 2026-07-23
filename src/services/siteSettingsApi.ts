import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { supabaseErrorMessage } from '../lib/supabaseErrors'

const PROMO_CODES_ENABLED_KEY = 'promo_codes_enabled'

/** Local/dev fallback when Supabase is not configured. */
let localPromoCodesEnabled = true

function parseBooleanSetting(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false
  return fallback
}

export async function isPromoCodesEnabled(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return localPromoCodesEnabled
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', PROMO_CODES_ENABLED_KEY)
    .maybeSingle()

  if (error) {
    // Missing table/migration → keep checkout usable; treat as enabled.
    if (
      error.message?.includes('site_settings') ||
      error.code === '42P01' ||
      error.code === 'PGRST205'
    ) {
      return true
    }
    throw new Error(supabaseErrorMessage(error))
  }

  if (!data) return true
  return parseBooleanSetting(data.value, true)
}

export async function setPromoCodesEnabled(enabled: boolean): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    localPromoCodesEnabled = enabled
    return
  }

  const { error } = await supabase.from('site_settings').upsert(
    {
      key: PROMO_CODES_ENABLED_KEY,
      value: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )

  if (error) throw new Error(supabaseErrorMessage(error))
}
