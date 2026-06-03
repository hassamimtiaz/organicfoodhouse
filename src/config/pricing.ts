import { formatUnitLabel } from '../config/units'
import { formatPricePKR } from './site'
import type { PriceType, Product } from '../types'

type PriceFields = Pick<Product, 'price' | 'price_max' | 'price_type'>
type UnitFields = Pick<Product, 'unit' | 'unit_min' | 'unit_max'>

export function normalizePriceType(
  price_type?: PriceType | null,
  price_max?: number | null,
): PriceType {
  if (price_type === 'range' || price_type === 'single') return price_type
  if (price_max != null && Number(price_max) > 0) return 'range'
  return 'single'
}

export function isPriceRange(product: PriceFields): boolean {
  return (
    normalizePriceType(product.price_type, product.price_max) === 'range' &&
    product.price_max != null &&
    Number(product.price_max) > Number(product.price)
  )
}

export function formatProductPrice(
  product: PriceFields,
  options?: { includeUnit?: UnitFields | string },
): string {
  const unitLabel =
    typeof options?.includeUnit === 'string'
      ? options.includeUnit
      : options?.includeUnit
        ? formatUnitLabel(options.includeUnit)
        : ''
  const unitSuffix = unitLabel ? ` / ${unitLabel}` : ''

  if (isPriceRange(product)) {
    return `${formatPricePKR(Number(product.price))} – ${formatPricePKR(Number(product.price_max))}${unitSuffix}`
  }

  return `${formatPricePKR(Number(product.price))}${unitSuffix}`
}

/** Prefix for range products on cards (e.g. "From") */
export function productPricePrefix(product: PriceFields): string | null {
  return isPriceRange(product) ? 'From' : null
}

/** Unit price used for order estimates (minimum of range) */
export function getOrderUnitPrice(product: PriceFields): number {
  return Number(product.price)
}

export function getOrderLineTotal(
  product: PriceFields,
  quantity: number,
): number {
  return getOrderUnitPrice(product) * quantity
}

export function getPriceRangeNote(): string {
  return 'Final price depends on size and grade. We will confirm the exact amount when we contact you.'
}
