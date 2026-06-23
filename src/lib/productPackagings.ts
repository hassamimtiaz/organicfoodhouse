import { isSupabaseConfigured, supabase } from './supabase'
import { normalizeProductPackagings } from './productNormalize'
import type { Product, ProductPackaging } from '../types'

type ProductRowWithPackagings = Product & {
  product_packagings?: ProductPackaging[] | null
}

export function extractPackagingsFromRow(
  row: ProductRowWithPackagings,
): ProductPackaging[] {
  return normalizeProductPackagings(row.product_packagings)
}

export function stripPackagingJoin<T extends ProductRowWithPackagings>(
  row: T,
): Product {
  const { product_packagings: _packagings, ...product } = row
  return product
}

export async function loadPackagingsForProducts(
  products: Product[],
): Promise<Product[]> {
  if (products.length === 0) return products
  if (!isSupabaseConfigured || !supabase) return products

  const ids = products.map((p) => p.id)
  const { data, error } = await supabase
    .from('product_packagings')
    .select('*')
    .in('product_id', ids)
    .order('sort_order')

  if (error) {
    if ((error as { code?: string }).code === '42P01') return products
    throw error
  }

  const byProduct = new Map<string, ProductPackaging[]>()
  for (const row of data ?? []) {
    const list = byProduct.get(row.product_id) ?? []
    list.push(row as ProductPackaging)
    byProduct.set(row.product_id, list)
  }

  return products.map((product) => ({
    ...product,
    packagings: normalizeProductPackagings(byProduct.get(product.id)),
  }))
}

export async function attachPackagingsToProduct(
  product: Product,
): Promise<Product> {
  const [withPackagings] = await loadPackagingsForProducts([product])
  return withPackagings
}
