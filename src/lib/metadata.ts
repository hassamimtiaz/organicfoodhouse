import type { Metadata } from 'next'
import { SITE } from '../config/site'
import { absoluteSiteUrl, resolveOgImage } from './seo'

export type PageMetadataInput = {
  title?: string
  description?: string
  path?: string
  image?: string
  robots?: string
}

export function buildPageMetadata({
  title,
  description = SITE.description,
  path = '',
  image,
  robots = 'index, follow',
}: PageMetadataInput = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${SITE.name}`
    : `${SITE.name} — Seasonal Organic Produce Online Pakistan`
  const canonical = absoluteSiteUrl(path || '/')
  const ogImage = resolveOgImage(image)

  return {
    metadataBase: new URL(SITE.url),
    title: fullTitle,
    description,
    robots,
    alternates: {
      canonical,
      languages: {
        'en-PK': canonical,
        'x-default': canonical,
      },
    },
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      shortcut: '/favicon.svg',
      apple: '/favicon.svg',
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      type: 'website',
      siteName: SITE.name,
      images: [{ url: ogImage, alt: `${SITE.name} — seasonal organic produce` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  }
}
