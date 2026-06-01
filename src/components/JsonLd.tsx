import { useEffect } from 'react'
import { SITE } from '../config/site'

export default function JsonLd() {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: SITE.name,
      description: SITE.description,
      url: SITE.url,
      email: SITE.email,
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
