import { slugFromName } from './slugify'
import type { Product } from '../types'

export function productSlugFor(product: Pick<Product, 'slug' | 'name'>): string {
  return product.slug || slugFromName(product.name) || 'product'
}

export function getProductUrl(product: Pick<Product, 'slug' | 'name'>): string {
  return `/product/${productSlugFor(product)}`
}
