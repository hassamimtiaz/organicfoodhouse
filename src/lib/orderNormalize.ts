import type { Order, OrderItem, OrderSource, OrderType } from '../types'

export function normalizeOrderRow(row: Order): Order {
  const amountReceived =
    row.amount_received != null && row.amount_received !== undefined
      ? Number(row.amount_received)
      : null
  const advancePayment =
    row.advance_payment != null && row.advance_payment !== undefined
      ? Number(row.advance_payment)
      : null

  return {
    ...row,
    total: Number(row.total),
    order_type: (row.order_type as OrderType) || 'order',
    order_source: (row.order_source as OrderSource) || 'website',
    advance_payment: advancePayment,
    amount_received: amountReceived,
    admin_notes: row.admin_notes ?? null,
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
