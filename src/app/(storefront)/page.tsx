import type { Metadata } from 'next'
import Home from '../../views/Home'
import { SITE } from '../../config/site'
import { buildPageMetadata } from '../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  path: '/',
  description: SITE.description,
  keywords:
    'organic fruit house, organic food online Pakistan, seasonal fruits, buy organic produce, farm fresh delivery, carbide free fruits, Rahim Yar Khan mangoes, Multan mangoes, pre order organic',
})

export default function HomePage() {
  return <Home />
}
