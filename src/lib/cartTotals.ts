import { isComingSoonProduct } from '../config/preorder'
import {
  getOrderLineTotal,
  getOrderUnitPrice,
  isPriceRange,
} from '../config/pricing'
import type { CartLine } from '../types'

export function getCartLineTotal(line: CartLine): number {
  return getOrderLineTotal(line.product, line.quantity, line.packaging_id)
}

export function getCartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + getCartLineTotal(line), 0)
}

export function cartHasPriceRange(lines: CartLine[]): boolean {
  return lines.some((line) => isPriceRange(line.product))
}

export function cartHasPreorder(lines: CartLine[]): boolean {
  return lines.some((line) => isComingSoonProduct(line.product))
}

export function getCartItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function formatCartLineUnitPrice(line: CartLine): number {
  return getOrderUnitPrice(line.product, line.packaging_id)
}
