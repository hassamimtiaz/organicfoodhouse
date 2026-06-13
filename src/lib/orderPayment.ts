import type { Order } from '../types'

/** Payment recorded on the order (prefers amount_received, falls back to advance_payment). */
export function getOrderAmountReceived(order: Order): number | null {
  if (order.amount_received != null && order.amount_received > 0) {
    return order.amount_received
  }
  if (order.advance_payment != null && order.advance_payment > 0) {
    return order.advance_payment
  }
  return null
}

export function getOrderBalanceDue(order: Order): number | null {
  const received = getOrderAmountReceived(order)
  if (received == null) return null
  return Math.max(0, Number(order.total) - received)
}
