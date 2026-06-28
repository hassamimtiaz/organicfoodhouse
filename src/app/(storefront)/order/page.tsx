import type { Metadata } from 'next'
import OrderPage from '../../../views/OrderPage'
import { buildPageMetadata } from '../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Checkout',
  path: '/order',
  robots: 'noindex, nofollow',
})

export default function OrderRoutePage() {
  return <OrderPage />
}
