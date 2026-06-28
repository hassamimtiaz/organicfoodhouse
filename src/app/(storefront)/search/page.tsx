import type { Metadata } from 'next'
import { Suspense } from 'react'
import Search from '../../../views/Search'
import { buildPageMetadata } from '../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Search',
  path: '/search',
  robots: 'noindex, nofollow',
})

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="status-msg container">Loading search…</p>}>
      <Search />
    </Suspense>
  )
}
