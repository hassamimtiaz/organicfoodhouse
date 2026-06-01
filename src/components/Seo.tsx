import { useEffect } from 'react'
import { SITE } from '../config/site'

interface SeoProps {
  title?: string
  description?: string
  path?: string
  keywords?: string
}

const DEFAULT_KEYWORDS =
  'organic food online Pakistan, seasonal fruits, buy organic produce, farm fresh delivery, carbide free fruits, organic mangoes, pre order organic'

export default function Seo({
  title,
  description = SITE.description,
  path = '',
  keywords = DEFAULT_KEYWORDS,
}: SeoProps) {
  const fullTitle = title
    ? `${title} | ${SITE.name}`
    : `${SITE.name} — Seasonal Organic Produce Online Pakistan`
  const canonical = `${SITE.url.replace(/\/$/, '')}${path}`

  useEffect(() => {
    document.title = fullTitle

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', description)
    setMeta('keywords', keywords)
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical
  }, [fullTitle, description, canonical, keywords])

  return null
}
