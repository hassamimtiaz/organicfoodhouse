import type { Metadata } from 'next'
import AboutUs from '../../../views/AboutUs'
import { buildPageMetadata } from '../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'About Us',
  path: '/about-us',
  description:
    'Learn about Organic Fruit House — farm-fresh organic produce from Rahim Yar Khan and Multan, delivered across Pakistan.',
})

export default function AboutUsPage() {
  return <AboutUs />
}
