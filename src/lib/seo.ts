import { getDefaultPackaging, getPackagingUnitPrice, hasPackagings } from '../config/packaging'
import { getDiscountedPriceFields } from '../config/pricing'
import { allowsAdvanceOrderWhenOutOfStock, isComingSoonProduct } from '../config/preorder'
import { getProductPrimaryImage } from '../config/productImages'
import { SITE } from '../config/site'
import { getProductUrl } from './productSlug'
import type { BreadcrumbItem } from '../components/Breadcrumbs'
import type { Product } from '../types'

export const DEFAULT_OG_IMAGE = '/images/hero/mango-in-hand.png'

export function absoluteSiteUrl(path = ''): string {
  const base = SITE.url.replace(/\/$/, '')
  if (!path || path === '/') return `${base}/`
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function resolveOgImage(image?: string | null): string {
  const src = image?.trim() || DEFAULT_OG_IMAGE
  return src.startsWith('http') ? src : absoluteSiteUrl(src)
}

function productAvailability(product: Product): string {
  if (isComingSoonProduct(product) && product.in_stock) {
    return 'https://schema.org/PreOrder'
  }
  if (allowsAdvanceOrderWhenOutOfStock(product)) {
    return 'https://schema.org/PreOrder'
  }
  if (!product.in_stock) return 'https://schema.org/OutOfStock'
  return 'https://schema.org/InStock'
}

function productOfferPrice(product: Product): number {
  if (hasPackagings(product)) {
    const packaging = getDefaultPackaging(product)
    if (packaging) return getPackagingUnitPrice(product, packaging)
  }
  return getDiscountedPriceFields(product).price
}

function slugToLabel(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function buildProductBreadcrumbItems(
  product: Product,
  categoryPath: { parentSlug: string; subSlug: string } | null,
): BreadcrumbItem[] {
  return [
    { label: 'Shop', to: '/' },
    ...(categoryPath
      ? [
          {
            label: slugToLabel(categoryPath.parentSlug),
            to: `/category/${categoryPath.parentSlug}`,
          },
          {
            label: slugToLabel(categoryPath.subSlug),
            to: `/category/${categoryPath.parentSlug}/${categoryPath.subSlug}`,
          },
        ]
      : []),
    { label: product.name },
  ]
}

export function buildProductSchema(product: Product) {
  const image = getProductPrimaryImage(product)
  const productUrl = absoluteSiteUrl(getProductUrl(product))

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.slug ?? product.id,
    url: productUrl,
    ...(product.description ? { description: product.description } : {}),
    image: resolveOgImage(image),
    brand: {
      '@type': 'Brand',
      name: SITE.name,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'PKR',
      price: productOfferPrice(product),
      availability: productAvailability(product),
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: SITE.name,
      },
    },
  }
}

export function buildFaqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildBreadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.to ? { item: absoluteSiteUrl(item.to) } : {}),
    })),
  }
}

export function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE.name,
    description: SITE.description,
    telephone: SITE.phoneTel,
    url: absoluteSiteUrl('/'),
    image: resolveOgImage(DEFAULT_OG_IMAGE),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lahore',
      addressCountry: 'PK',
    },
    areaServed: SITE.deliveryArea,
    priceRange: '₨₨',
  }
}
