import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PRIMARY = 'https://www.organicfruithouse.com'

/** Hosts that must 301 to the primary .com domain (both spellings). */
const REDIRECT_HOSTS = new Set([
  'www.organicfoodhouse.pk',
  'organicfoodhouse.pk',
  'www.organicfruithouse.pk',
  'organicfruithouse.pk',
  'organicfruithouse.com',
])

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase()
  if (!host || !REDIRECT_HOSTS.has(host)) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl
  const destination = new URL(`${pathname}${search}`, PRIMARY)
  return NextResponse.redirect(destination, 301)
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
}
