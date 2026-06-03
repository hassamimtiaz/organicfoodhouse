/** User-facing message from Supabase / PostgREST errors */
export function supabaseErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = String((err as { message: unknown }).message)
    const code =
      'code' in err ? String((err as { code: unknown }).code) : undefined

    if (code === 'PGRST204') {
      if (message.includes('price_max') || message.includes('price_type')) {
        return 'Database is missing price range columns. Run supabase/migrations/005_product_price_range.sql in the Supabase SQL editor, then try again.'
      }
      if (message.includes('unit_min') || message.includes('unit_max')) {
        return 'Database is missing unit range columns. Run supabase/migrations/006_product_unit_range.sql in the Supabase SQL editor, then try again.'
      }
    }

    return message
  }
  return 'Request failed'
}

export function isMissingColumnError(
  err: unknown,
  columns: string[],
): boolean {
  if (typeof err !== 'object' || err === null) return false
  const code = 'code' in err ? String((err as { code: unknown }).code) : ''
  if (code !== 'PGRST204') return false
  const message =
    'message' in err ? String((err as { message: unknown }).message) : ''
  return columns.some((col) => message.includes(col))
}
