/**
 * Public env vars — Next.js only inlines NEXT_PUBLIC_* when accessed with
 * static property names (not process.env[variableName]).
 */
export function publicEnv(name: string): string | undefined {
  switch (name) {
    case 'SUPABASE_URL':
      return (
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
      )
    case 'SUPABASE_ANON_KEY':
      return (
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.VITE_SUPABASE_ANON_KEY
      )
    case 'SITE_URL':
      return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VITE_SITE_URL
    default:
      return undefined
  }
}
