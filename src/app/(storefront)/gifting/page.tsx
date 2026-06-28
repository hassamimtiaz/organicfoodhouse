import type { Metadata } from 'next'
import GiftingPage from '../../../views/GiftingPage'
import { buildPageMetadata } from '../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Gift Fruit Boxes & Baskets',
  path: '/gifting',
  description:
    'Send organic fruit gift boxes and baskets instead of mithai — fresh, seasonal, and carbide-free from Organic Fruit House.',
})

export default function GiftingRoutePage() {
  return <GiftingPage />
}
