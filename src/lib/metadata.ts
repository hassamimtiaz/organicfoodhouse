import type { Metadata } from 'next'
import { SITE } from '../config/site'
import { absoluteSiteUrl, resolveOgImage } from './seo'

const DEFAULT_KEYWORDS =
  'organic fruit house, organic food online Pakistan, seasonal fruits, buy organic produce, farm fresh delivery, carbide free fruits, organic mangoes, Rahim Yar Khan mangoes, Multan mangoes, pre order organic'

export type PageMetadataInput = {
  title?: string
  description?: string
  path?: string
  keywords?: string
  image?: string
  robots?: string
}

export function buildPageMetadata({
  title,
  description = SITE.description,
  path = '',
  keywords = DEFAULT_KEYWORDS,
  image,
  robots = 'index, follow',
}: PageMetadataInput = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${SITE.name}`
    : `${SITE.name} — Seasonal Organic Produce Online Pakistan`
  const canonical = absoluteSiteUrl(path || '/')
  const ogImage = resolveOgImage(image)

  return {
    title: fullTitle,
    description,
    keywords,
    robots,
    alternates: { canonical },
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
