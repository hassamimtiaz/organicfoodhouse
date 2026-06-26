import { getDefaultPackaging, getPackagingUnitPrice, hasPackagings } from '../config/packaging'
import { getDiscountedPriceFields } from '../config/pricing'
import { isComingSoonProduct } from '../config/preorder'
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

export function buildProductSchema(product: Product) {
  const image = getProductPrimaryImage(product)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    image: resolveOgImage(image),
    brand: {
      '@type': 'Brand',
      name: SITE.name,
    },
    offers: {
      '@type': 'Offer',
      url: absoluteSiteUrl(getProductUrl(product)),
      priceCurrency: 'PKR',
      price: productOfferPrice(product),
      availability: productAvailability(product),
    },
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
