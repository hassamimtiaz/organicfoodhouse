import type { Metadata } from 'next'
import CartPage from '../../../views/CartPage'
import { buildPageMetadata } from '../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Cart',
  path: '/cart',
  robots: 'noindex, nofollow',
})

export default function CartRoutePage() {
  return <CartPage />
}
