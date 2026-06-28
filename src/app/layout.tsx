import type { Metadata } from 'next'
import JsonLdServer from '../components/JsonLdServer'
import Providers from '../components/Providers'
import { buildPageMetadata } from '../lib/metadata'
import { buildLocalBusinessSchema } from '../lib/seo'
import './globals.css'

export const metadata: Metadata = buildPageMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-PK">
      <body>
        <JsonLdServer
          id="json-ld-local-business"
          data={buildLocalBusinessSchema()}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
