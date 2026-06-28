import type { MetadataRoute } from 'next'
import { publicEnv } from '../lib/env'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (
    publicEnv('SITE_URL') ?? 'https://www.organicfruithouse.com'
  ).replace(/\/$/, '')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/cart', '/order'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
