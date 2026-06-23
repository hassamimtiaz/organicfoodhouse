import { normalizeProductImages } from '../config/productImages'
import { loadPackagingsForProducts } from './productPackagings'
import { isSupabaseConfigured, supabase } from './supabase'
import type { Product, ProductImage } from '../types'

export async function loadImagesForProducts(
  products: Product[],
): Promise<Product[]> {
  if (products.length === 0) return products
  if (!isSupabaseConfigured || !supabase) return products

  const ids = products.map((p) => p.id)
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', ids)
    .order('sort_order')

  if (error) {
    if ((error as { code?: string }).code === '42P01') return products
    throw error
  }

  const byProduct = new Map<string, ProductImage[]>()
  for (const row of data ?? []) {
    const list = byProduct.get(row.product_id) ?? []
    list.push(row as ProductImage)
    byProduct.set(row.product_id, list)
  }

  return products.map((product) => {
    const images = normalizeProductImages(byProduct.get(product.id))
    const primary = images[0]?.image_url ?? product.image_url
    return {
      ...product,
      images,
      image_url: primary ?? null,
    }
  })
}

export async function attachImagesToProduct(product: Product): Promise<Product> {
  const [withImages] = await loadImagesForProducts([product])
  return withImages
}

export async function enrichProducts(products: Product[]): Promise<Product[]> {
  const withPackagings = await loadPackagingsForProducts(products)
  return loadImagesForProducts(withPackagings)
}
