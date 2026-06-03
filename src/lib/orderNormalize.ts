import type { Order, OrderItem, OrderType } from '../types'

export function normalizeOrderRow(row: Order): Order {
  return {
    ...row,
    total: Number(row.total),
    order_type: (row.order_type as OrderType) || 'order',
    advance_payment:
      row.advance_payment != null && row.advance_payment !== undefined
        ? Number(row.advance_payment)
        : null,
  }
}

export function normalizeOrderItemRow(row: OrderItem): OrderItem {
  return {
    ...row,
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    line_total: Number(row.line_total),
  }
}

export function parseAdvancePayment(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount)
}
