import type { OrderSuccessPayload } from '../types'

const STORAGE_KEY = 'ofh-order-success'

export function saveOrderSuccessPayload(payload: OrderSuccessPayload): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage errors
  }
}

export function loadOrderSuccessPayload(): OrderSuccessPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OrderSuccessPayload
    if (
      !parsed.customerName ||
      !parsed.phone ||
      !Array.isArray(parsed.productIds) ||
      !Array.isArray(parsed.productNames)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearOrderSuccessPayload(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}

export function formatOrderProductList(names: string[]): string {
  if (names.length === 0) return 'your items'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}
