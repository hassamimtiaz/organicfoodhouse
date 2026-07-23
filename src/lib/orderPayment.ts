import type { Order, OrderExtraCharge } from '../types'
import {
  getExtraChargesTotal,
  normalizeExtraCharges,
} from './orderExtraCharges'

/** Product line total (excludes invoice adjustments). */
export function getOrderProductTotal(order: Order): number {
  return Number(order.total)
}

export function getOrderDeliveryCharge(order: Order): number {
  return order.delivery_charge != null && order.delivery_charge > 0
    ? Number(order.delivery_charge)
    : 0
}

export function getOrderExtraCharges(order: Order): OrderExtraCharge[] {
  return normalizeExtraCharges(order.extra_charges)
}

export function getOrderInvoiceAdjustmentLines(order: Order): OrderExtraCharge[] {
  const lines = getOrderExtraCharges(order)
  if (lines.length > 0) return lines

  const legacy: OrderExtraCharge[] = []
  if (getOrderDeliveryCharge(order) > 0) {
    legacy.push({
      label: 'Delivery Charges',
      amount: getOrderDeliveryCharge(order),
      kind: 'charge',
    })
  }
  if (getOrderDiscount(order) > 0) {
    legacy.push({
      label: order.promo_code ? `Promo (${order.promo_code})` : 'Discount',
      amount: getOrderDiscount(order),
      kind: 'discount',
    })
  }
  return legacy
}

export function getOrderExtraChargesTotal(order: Order): number {
  return getExtraChargesTotal(getOrderExtraCharges(order))
}

export function getOrderDiscount(order: Order): number {
  return order.discount != null && order.discount > 0 ? Number(order.discount) : 0
}

/**
 * Product total + invoice adjustments.
 * Prefer stored invoice lines when present; otherwise legacy delivery − discount.
 */
export function getOrderGrandTotal(order: Order): number {
  const product = getOrderProductTotal(order)
  const lines = getOrderExtraCharges(order)
  if (lines.length > 0) {
    return Math.max(0, product + getExtraChargesTotal(lines))
  }
  return Math.max(
    0,
    product + getOrderDeliveryCharge(order) - getOrderDiscount(order),
  )
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
