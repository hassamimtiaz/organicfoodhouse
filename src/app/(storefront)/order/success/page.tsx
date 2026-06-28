import type { Metadata } from 'next'
import OrderSuccessPage from '../../../../views/OrderSuccessPage'
import { buildPageMetadata } from '../../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Order confirmed',
  path: '/order/success',
  robots: 'noindex, nofollow',
})

export default function OrderSuccessRoutePage() {
  return <OrderSuccessPage />
}
