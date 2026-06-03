import type { Product } from '../types'

/** Default first delivery date for Premium Chaunsa (YYYY-MM-DD) */
export const PREMIUM_CHAUNSA_DELIVERY_START = '2026-07-05'

export function parseDeliveryStartDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function formatDeliveryStartLabel(isoDate: string): string {
  const date = parseDeliveryStartDate(isoDate)
  return date.toLocaleDateString('en-PK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getDeliveryStartDate(product: Product): Date | null {
  if (product.delivery_starts_at) {
    return parseDeliveryStartDate(product.delivery_starts_at)
  }
  return null
}

export function isComingSoonProduct(product: Product): boolean {
  return product.coming_soon === true
}

/** Countdown still relevant (before first delivery day) */
export function isPreorderCountdownActive(product: Product): boolean {
  if (!isComingSoonProduct(product)) return false
  const start = getDeliveryStartDate(product)
  if (!start) return true
  return Date.now() < start.getTime()
}

export function acceptsPreorder(product: Product): boolean {
  return product.in_stock
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
