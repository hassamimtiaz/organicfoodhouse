'use client'

import { useEffect } from 'react'
import { SITE } from '../config/site'
import { absoluteSiteUrl, resolveOgImage } from '../lib/seo'

interface SeoProps {
  title?: string
  description?: string
  path?: string
  keywords?: string
  image?: string
  robots?: string
}

const DEFAULT_KEYWORDS =
  'organic fruit house, organic food online Pakistan, seasonal fruits, buy organic produce, farm fresh delivery, carbide free fruits, organic mangoes, Rahim Yar Khan mangoes, Multan mangoes, pre order organic'

export default function Seo({
  title,
  description = SITE.description,
  path = '',
  keywords = DEFAULT_KEYWORDS,
  image,
  robots = 'index, follow',
}: SeoProps) {
  const fullTitle = title
    ? `${title} | ${SITE.name}`
    : `${SITE.name} — Seasonal Organic Produce Online Pakistan`
  const canonical = absoluteSiteUrl(path || '/')
  const ogImage = resolveOgImage(image)

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
    setMeta('robots', robots)
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', canonical, 'property')
    setMeta('og:type', 'website', 'property')
    setMeta('og:site_name', SITE.name, 'property')
    setMeta('og:image', ogImage, 'property')
    setMeta('og:image:alt', `${SITE.name} — seasonal organic produce`, 'property')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', ogImage)

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical
  }, [fullTitle, description, canonical, keywords, robots, ogImage])

  return null
}
