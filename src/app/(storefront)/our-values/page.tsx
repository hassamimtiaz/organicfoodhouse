import type { Metadata } from 'next'
import OurValues from '../../../views/OurValues'
import { buildPageMetadata } from '../../../lib/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Our Values',
  path: '/our-values',
  description:
    'Our commitment to carbide-free, naturally ripened organic fruit and honest farm-to-door delivery across Pakistan.',
})

export default function OurValuesPage() {
  return <OurValues />
}
