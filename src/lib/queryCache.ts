export const DEFAULT_STALE_MS = 5 * 60 * 1000

type CacheEntry = {
  data: unknown
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()

export function getQueryCache<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined
}

export function setQueryCache<T>(key: string, data: T) {
  cache.set(key, { data, fetchedAt: Date.now() })
}

export function isQueryStale(
  key: string,
  staleTime = DEFAULT_STALE_MS,
): boolean {
  const entry = cache.get(key)
  if (!entry) return true
  return Date.now() - entry.fetchedAt >= staleTime
}

export async function fetchQuery<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>

  const promise = fn()
    .then((data) => {
      setQueryCache(key, data)
      inflight.delete(key)
      return data
    })
    .catch((error) => {
      inflight.delete(key)
      throw error
    })

  inflight.set(key, promise)
  return promise
}

export const queryKeys = {
  visibleProducts: 'products:visible',
  topCategories: 'categories:top',
  category: (slug: string) => `category:${slug}`,
  subcategory: (parentSlug: string, subSlug: string) =>
    `subcategory:${parentSlug}/${subSlug}`,
  product: (ref: string) => `product:${ref}`,
  productGallery: (productId: string) => `product-gallery:${productId}`,
  productRecommendations: (productId: string) =>
    `product-recommendations:${productId}`,
  search: (query: string) => `search:${query.trim().toLowerCase()}`,
} as const
