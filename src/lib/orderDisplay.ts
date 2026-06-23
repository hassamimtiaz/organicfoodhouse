import type { Order, OrderItem } from '../types'

/** Whole number of boxes ordered (1, 2, or 3) */
export function formatOrderPackCount(quantity: number): string {
  const n = Math.round(quantity)
  return String(n)
}

/** @deprecated Use formatOrderBoxCountLabel */
export const formatOrderPackCountLabel = formatOrderBoxCountLabel

export function formatOrderBoxCountLabel(quantity: number): string {
  const n = Math.round(quantity)
  return `${n}`
}

/** Box contents / size stored on the order line (e.g. "5 kg · Gift box") */
export function formatOrderPackSize(unit: string): string {
  return unit.trim()
}

export function formatPricePerBox(): string {
  return '/ Box'
}

export function formatPerBoxPhrase(): string {
  return 'per Box'
}

export function formatOrderLineSummary(item: OrderItem): string {
  const boxes = formatOrderBoxCountLabel(item.quantity)
  const size = formatOrderPackSize(item.unit)
  const isSimpleMeasure =
    size.length <= 4 &&
    !size.includes('~') &&
    !size.includes('–') &&
    !size.includes('-')
  if (isSimpleMeasure) {
    return `${boxes} · ${size} each`
  }
  return `${boxes} · ${size} ${formatPerBoxPhrase()}`
}

/** Sequential invoice number across all orders (000001, 000002, …) */
export function getInvoiceSequence(order: Order, allOrders: Order[]): string {
  const sorted = [...allOrders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  const idx = sorted.findIndex((o) => o.id === order.id)
  const seq = idx >= 0 ? idx + 1 : sorted.length + 1
  return String(seq).padStart(6, '0')
}
