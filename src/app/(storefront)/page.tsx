import type { Metadata } from 'next'
import JsonLdServer from '../../components/JsonLdServer'
import Home from '../../views/Home'
import { HOME_FAQ } from '../../config/faq'
import { buildPageMetadata } from '../../lib/metadata'
import { buildFaqPageSchema } from '../../lib/seo'

export const metadata: Metadata = buildPageMetadata({
  path: '/',
  description:
    'Buy mangoes online in Lahore and all over Pakistan — carbide-free organic Chaunsa, Sindhri, Dasheri & Anwar Ratol from Organic Fruit House. Farm-fresh delivery nationwide.',
})

export default function HomePage() {
  return (
    <>
      <JsonLdServer id="json-ld-faq" data={buildFaqPageSchema(HOME_FAQ)} />
      <Home />
    </>
  )
}
