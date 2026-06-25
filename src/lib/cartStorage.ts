import type { CartLine } from '../types'
import { getDefaultPackaging, hasPackagings } from '../config/packaging'
import { isPackagingOrderable } from '../lib/packagingStock'

export const CART_STORAGE_KEY = 'ofh-cart'

/** Minimum boxes per cart line */
export const MIN_PACKS_PER_ITEM = 1

export function clampPackQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_PACKS_PER_ITEM
  return Math.max(MIN_PACKS_PER_ITEM, Math.round(quantity))
}

function normalizeCartLine(line: CartLine): CartLine | null {
  if (!line?.product?.id || !line.product.in_stock) return null
  if (typeof line.quantity !== 'number') return null

  let packaging_id = line.packaging_id ?? null
  if (hasPackagings(line.product)) {
    const packaging = line.product.packagings?.find((p) => p.id === packaging_id)
    if (!packaging || !isPackagingOrderable(packaging)) {
      const fallback = getDefaultPackaging(line.product)
      packaging_id = fallback?.id ?? null
    }
    if (!packaging_id) return null
  } else {
    packaging_id = null
  }

  return {
    product: line.product,
    packaging_id,
    quantity: clampPackQuantity(line.quantity),
  }
}

export function loadCartFromStorage(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartLine[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((line) => normalizeCartLine(line))
      .filter((line): line is CartLine => line != null)
  } catch {
    return []
  }
}

export function saveCartToStorage(items: CartLine[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore quota / private mode errors
  }
}
