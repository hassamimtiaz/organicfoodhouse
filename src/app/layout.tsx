import type { Metadata } from 'next'
import Providers from '../components/Providers'
import { buildPageMetadata } from '../lib/metadata'
import './globals.css'

export const metadata: Metadata = buildPageMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
