import type { CartLine } from '../types'

export const CART_STORAGE_KEY = 'ofh-cart'
export const MAX_PACKS_PER_ITEM = 3

export function clampPackQuantity(quantity: number): number {
  return Math.min(MAX_PACKS_PER_ITEM, Math.max(1, Math.round(quantity)))
}

export function loadCartFromStorage(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartLine[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (line) =>
          line?.product?.id &&
          line.product.in_stock &&
          typeof line.quantity === 'number',
      )
      .map((line) => ({
        product: line.product,
        quantity: clampPackQuantity(line.quantity),
      }))
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
