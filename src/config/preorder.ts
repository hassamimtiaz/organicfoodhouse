import type { Product, SoldOutMode } from '../types'

/** Default first delivery date for Premium Chaunsa (YYYY-MM-DD) */
export const PREMIUM_CHAUNSA_DELIVERY_START = '2026-07-05'

function normalizeDeliveryDateInput(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const dateOnly = trimmed.includes('T') ? trimmed.slice(0, 10) : trimmed
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null
}

export function parseDeliveryStartDate(isoDate: string): Date {
  const normalized = normalizeDeliveryDateInput(isoDate)
  if (!normalized) return new Date(Number.NaN)
  const [y, m, d] = normalized.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function formatDeliveryStartLabel(isoDate: string): string {
  const date = parseDeliveryStartDate(isoDate)
  if (Number.isNaN(date.getTime())) return 'scheduled date'
  return date.toLocaleDateString('en-PK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getDeliveryStartDate(product: Product): Date | null {
  if (product.delivery_starts_at) {
    const parsed = parseDeliveryStartDate(product.delivery_starts_at)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function isComingSoonProduct(product: Product): boolean {
  return product.coming_soon === true
}

export function normalizeSoldOutMode(
  value: SoldOutMode | string | null | undefined,
): SoldOutMode {
  if (value === 'preorder' || value === 'restock') return value
  return 'block'
}

export function getSoldOutMode(product: Product): SoldOutMode {
  return normalizeSoldOutMode(product.sold_out_mode)
}

/** Out of stock but customers may still place an advance order */
export function allowsAdvanceOrderWhenOutOfStock(product: Product): boolean {
  if (product.in_stock) return false
  const mode = getSoldOutMode(product)
  return mode === 'preorder' || mode === 'restock'
}

/** Customer can add to cart / checkout */
export function isProductOrderable(product: Product): boolean {
  return product.in_stock || allowsAdvanceOrderWhenOutOfStock(product)
}

/** Countdown still relevant (before first delivery day) */
export function isPreorderCountdownActive(product: Product): boolean {
  if (!isComingSoonProduct(product)) return false
  const start = getDeliveryStartDate(product)
  if (!start) return true
  return Date.now() < start.getTime()
}

export function acceptsPreorder(product: Product): boolean {
  return isProductOrderable(product)
}

/** Order should be stored as order_type = preorder */
export function isPreorderOrder(product: Product): boolean {
  return isComingSoonProduct(product) || allowsAdvanceOrderWhenOutOfStock(product)
}

export function getAdvanceOrderLabel(product: Product): string {
  if (!product.in_stock && getSoldOutMode(product) === 'restock') {
    return 'Restock order'
  }
  if (isPreorderOrder(product)) return 'Pre-order'
  return 'Order'
}

export function getAddToCartLabel(product: Product): string {
  if (isPreorderOrder(product)) return 'Pre-order'
  return 'Add to cart'
}

export function getCountdownTarget(product: Product): Date | null {
  if (!isPreorderCountdownActive(product)) return null
  return getDeliveryStartDate(product)
}

export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  expired: boolean
}

export function getCountdownParts(target: Date, now = Date.now()): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now)
  const expired = totalMs <= 0
  const totalSec = Math.floor(totalMs / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours, minutes, seconds, totalMs, expired }
}
