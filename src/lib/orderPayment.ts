import type { Order } from '../types'

/** Product line total (excludes delivery and discount). */
export function getOrderProductTotal(order: Order): number {
  return Number(order.total)
}

export function getOrderDeliveryCharge(order: Order): number {
  return order.delivery_charge != null && order.delivery_charge > 0
    ? Number(order.delivery_charge)
    : 0
}

export function getOrderDiscount(order: Order): number {
  return order.discount != null && order.discount > 0 ? Number(order.discount) : 0
}

/** Product total + delivery − discount (never below zero). */
export function getOrderGrandTotal(order: Order): number {
  const raw =
    getOrderProductTotal(order) +
    getOrderDeliveryCharge(order) -
    getOrderDiscount(order)
  return Math.max(0, raw)
}

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
  return Math.max(0, getOrderGrandTotal(order) - received)
}

export function getOrderBoxCount(order: Order): number {
  if (!order.items?.length) return 0
  return order.items.reduce((sum, item) => sum + Number(item.quantity), 0)
}
