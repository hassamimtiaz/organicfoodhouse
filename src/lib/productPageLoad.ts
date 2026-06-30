import type { Product } from '../types'
import {
  fetchProductBySlugOrId,
  getProductCategoryPath,
} from '../services/ordersApi'
import { fetchQuery, getQueryCache, queryKeys } from './queryCache'

export type ProductCoreData = {
  product: Product
  categoryPath: { parentSlug: string; subSlug: string } | null
}

export async function loadProductCore(ref: string): Promise<ProductCoreData> {
  const product = await fetchProductBySlugOrId(ref, { includeGallery: false })
  if (!product) {
    throw new Error('Product not found')
  }

  const categoryPath = await getProductCategoryPath(product)
  return { product, categoryPath }
}

/** Warm the cache before navigation (hover / touch on product cards). */
export function prefetchProductPage(slug: string) {
  if (!slug) return
  const key = queryKeys.product(slug)
  if (getQueryCache<ProductCoreData>(key)) return
  void fetchQuery(key, () => loadProductCore(slug))
}
