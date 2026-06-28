'use client'

import { useEffect } from 'react'
import { SITE } from '../config/site'
import { absoluteSiteUrl, DEFAULT_OG_IMAGE } from '../lib/seo'

export default function JsonLd() {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: SITE.name,
      description: SITE.description,
      url: SITE.url,
      image: absoluteSiteUrl(DEFAULT_OG_IMAGE),
      telephone: SITE.phoneTel,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PK',
      },
      areaServed: SITE.deliveryArea,
      priceRange: '₨₨',
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'json-ld-store'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)

    return () => {
      document.getElementById('json-ld-store')?.remove()
    }
  }, [])

  return null
}
