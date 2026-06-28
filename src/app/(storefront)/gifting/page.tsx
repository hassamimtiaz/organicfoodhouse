import type { Metadata } from 'next'
import GiftingPage from '../../../views/GiftingPage'
import { buildPageMetadata } from '../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Mango Gift Baskets Lahore — Organic Fruit Gift Boxes',
  path: '/gifting',
  description:
    'Mango gift baskets Lahore and across Pakistan — organic fruit gift boxes and buckets instead of mithai. Carbide-free, beautifully packed from Organic Fruit House.',
  keywords:
    'mango gift baskets Lahore, fruit gift box Pakistan, mango gift basket, gift fruit instead of mithai, Eid fruit gift Lahore',
})

export default function GiftingRoutePage() {
  return <GiftingPage />
}
