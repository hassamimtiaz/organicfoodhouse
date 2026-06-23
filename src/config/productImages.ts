import type { Product, ProductImage } from '../types'

export const MANGO_PRODUCT_IMAGES = {
  dasheri:
    'https://images.unsplash.com/photo-1605027990121-cbae9e63ab02?w=800&q=80&auto=format&fit=crop',
  sindhri:
    'https://images.unsplash.com/photo-1553279768-8650adbb2896?w=800&q=80&auto=format&fit=crop',
  chaunsa:
    'https://images.unsplash.com/photo-1619568428299-a69f8c8e64e0?w=800&q=80&auto=format&fit=crop',
  anwarRatol:
    'https://images.unsplash.com/photo-1591284009650-0a12a8e2ed24?w=800&q=80&auto=format&fit=crop',
} as const

export function normalizeProductImageRow(row: ProductImage): ProductImage {
  return {
    ...row,
    image_url: row.image_url.trim(),
    sort_order: Number(row.sort_order ?? 0),
  }
}

export function sortProductImages(images: ProductImage[]): ProductImage[] {
  return [...images].sort((a, b) => a.sort_order - b.sort_order)
}

export function normalizeProductImages(
  raw: ProductImage[] | undefined | null,
): ProductImage[] {
  if (!raw?.length) return []
  return sortProductImages(raw.map(normalizeProductImageRow))
}

/** All gallery URLs for a product (falls back to legacy image_url). */
export function getProductImageUrls(
  product: Pick<Product, 'images' | 'image_url'>,
): string[] {
  const fromGallery = normalizeProductImages(product.images)
    .map((img) => img.image_url)
    .filter(Boolean)
  if (fromGallery.length > 0) return fromGallery
  if (product.image_url?.trim()) return [product.image_url.trim()]
  return []
}

export function getProductPrimaryImage(
  product: Pick<Product, 'images' | 'image_url'>,
): string | null {
  return getProductImageUrls(product)[0] ?? null
}

export function hasMultipleProductImages(
  product: Pick<Product, 'images' | 'image_url'>,
): boolean {
  return getProductImageUrls(product).length > 1
}
