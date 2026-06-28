import type { Metadata } from 'next'
import CatalogPage from '../../../views/CatalogPage'
import { buildPageMetadata } from '../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Catalog',
  path: '/catalog',
  description:
    'Browse our organic fruit catalog — packaging options, seasonal availability, and live product listings.',
})

export default function CatalogRoutePage() {
  return <CatalogPage />
}
