import { applyDiscountPercent, hasProductDiscount } from './pricing'
import type { Product, ProductPackaging } from '../types'

type PackagingAwareProduct = Pick<Product, 'packagings'> &
  Partial<Pick<Product, 'discount_percent'>>

export function hasPackagings(
  product: Pick<Product, 'packagings'>,
): boolean {
  return (product.packagings?.length ?? 0) > 0
}

export function getInStockPackagings(
  product: Pick<Product, 'packagings'>,
): ProductPackaging[] {
  if (!product.packagings?.length) return []
  return product.packagings.filter((p) => p.in_stock)
}

export function getPackagingById(
  product: Pick<Product, 'packagings'>,
  packagingId: string | null | undefined,
): ProductPackaging | null {
  if (!packagingId || !product.packagings?.length) return null
  return product.packagings.find((p) => p.id === packagingId) ?? null
}

export function getDefaultPackaging(
  product: Pick<Product, 'packagings'>,
): ProductPackaging | null {
  const inStock = getInStockPackagings(product)
  if (inStock.length === 0) return product.packagings?.[0] ?? null
  return inStock[0]
}

export function formatPackagingWeight(packaging: ProductPackaging): string {
  const weight = Number(packaging.weight)
  const value = Number.isInteger(weight) ? String(weight) : String(weight)
  return `${value} ${packaging.unit.trim()}`
}

/** e.g. "5 kg · Premium gift box" */
export function formatPackagingLabel(packaging: ProductPackaging): string {
  const size = formatPackagingWeight(packaging)
  const label = packaging.label.trim()
  return label ? `${size} · ${label}` : size
}

export function getPackagingUnitPrice(
  product: PackagingAwareProduct,
  packaging: ProductPackaging,
): number {
  const base = Number(packaging.price)
  if (!hasProductDiscount(product)) return base
  return applyDiscountPercent(base, product.discount_percent!)
}

export function getPackagingPriceRange(
  product: PackagingAwareProduct,
): { min: number; max: number } | null {
  const options = getInStockPackagings(product)
  if (options.length === 0) return null
  const prices = options.map((p) => getPackagingUnitPrice(product, p))
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

export function packagingPricePrefix(
  product: PackagingAwareProduct,
): string | null {
  const range = getPackagingPriceRange(product)
  if (!range || range.min === range.max) return null
  return 'From'
}

export function normalizePackagingRow(row: ProductPackaging): ProductPackaging {
  return {
    ...row,
    weight: Number(row.weight),
    price: Number(row.price),
    sort_order: Number(row.sort_order ?? 0),
    label: row.label ?? '',
    unit: row.unit?.trim() || 'kg',
    in_stock: row.in_stock !== false,
  }
}

export function sortPackagings(
  packagings: ProductPackaging[],
): ProductPackaging[] {
  return [...packagings].sort(
    (a, b) => a.sort_order - b.sort_order || a.weight - b.weight,
  )
}

export function syncProductPriceFromPackagings(
  product: Pick<Product, 'price' | 'unit'>,
  packagings: ProductPackaging[],
): { price: number; unit: string } {
  if (packagings.length === 0) {
    return { price: product.price, unit: product.unit }
  }
  const sorted = sortPackagings(packagings)
  const minPrice = Math.min(...sorted.map((p) => Number(p.price)))
  return { price: minPrice, unit: sorted[0].unit.trim() || product.unit }
}
