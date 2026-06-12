import { clampPackQuantity } from './cartStorage'

export interface CheckoutLineSnapshot {
  productId: string
  quantity: number
}

const STORAGE_KEY = 'ofh-checkout'

export function saveDirectCheckout(lines: CheckoutLineSnapshot[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  } catch {
    // Ignore storage errors
  }
}

export function loadDirectCheckout(): CheckoutLineSnapshot[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CheckoutLineSnapshot[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed.map((line) => ({
      productId: String(line.productId),
      quantity: clampPackQuantity(line.quantity),
    }))
  } catch {
    return null
  }
}

export function clearDirectCheckout(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}

export function updateDirectCheckout(lines: CheckoutLineSnapshot[]): void {
  if (lines.length === 0) {
    clearDirectCheckout()
    return
  }
  saveDirectCheckout(lines)
}
