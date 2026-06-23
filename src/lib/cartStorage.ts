import type { CartLine } from '../types'
import { getDefaultPackaging, hasPackagings } from '../config/packaging'

export const CART_STORAGE_KEY = 'ofh-cart'
export const MAX_PACKS_PER_ITEM = 3

export function clampPackQuantity(quantity: number): number {
  return Math.min(MAX_PACKS_PER_ITEM, Math.max(1, Math.round(quantity)))
}

function normalizeCartLine(line: CartLine): CartLine | null {
  if (!line?.product?.id || !line.product.in_stock) return null
  if (typeof line.quantity !== 'number') return null

  let packaging_id = line.packaging_id ?? null
  if (hasPackagings(line.product)) {
    const packaging = line.product.packagings?.find((p) => p.id === packaging_id)
    if (!packaging || !packaging.in_stock) {
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
