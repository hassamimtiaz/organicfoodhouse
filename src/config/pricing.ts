import { formatUnitLabel } from '../config/units'
import { formatPricePKR } from './site'
import type { PriceType, Product } from '../types'

type PriceFields = Pick<Product, 'price' | 'price_max' | 'price_type'>
type UnitFields = Pick<Product, 'unit' | 'unit_min' | 'unit_max'>
type DiscountableProduct = PriceFields & Pick<Product, 'discount_percent'>

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

export function hasProductDiscount(
  product: Pick<Product, 'discount_percent'>,
): boolean {
  return (
    product.discount_percent != null &&
    product.discount_percent > 0 &&
    product.discount_percent <= 100
  )
}

export function applyDiscountPercent(price: number, percent: number): number {
  return Math.round(price * (1 - percent / 100))
}

export function getDiscountedPriceFields(product: DiscountableProduct): {
  price: number
  price_max: number | null
} {
  const basePrice = Number(product.price)
  if (!hasProductDiscount(product)) {
    return {
      price: basePrice,
      price_max:
        product.price_max != null ? Number(product.price_max) : null,
    }
  }

  const percent = product.discount_percent!
  return {
    price: applyDiscountPercent(basePrice, percent),
    price_max:
      product.price_max != null
        ? applyDiscountPercent(Number(product.price_max), percent)
        : null,
  }
}

/** Product fields with discount applied — for display and order totals */
export function withDiscountApplied(product: DiscountableProduct): PriceFields {
  const discounted = getDiscountedPriceFields(product)
  return {
    ...product,
    price: discounted.price,
    price_max: discounted.price_max,
  }
}

export function formatProductPrice(
  product: DiscountableProduct,
  options?: {
    includeUnit?: UnitFields | string
    /** When true (default), show discounted amounts if a discount is set */
    applyDiscount?: boolean
    /** Include original price text for string-only contexts (search, admin list) */
    showWasPrice?: boolean
  },
): string {
  const applyDiscount = options?.applyDiscount !== false
  const displayProduct =
    applyDiscount && hasProductDiscount(product)
      ? withDiscountApplied(product)
      : product

  const unitLabel =
    typeof options?.includeUnit === 'string'
      ? options.includeUnit
      : options?.includeUnit
        ? formatUnitLabel(options.includeUnit)
        : ''
  const unitSuffix = unitLabel ? ` / ${unitLabel}` : ''

  const saleText = isPriceRange(displayProduct)
    ? `${formatPricePKR(Number(displayProduct.price))} – ${formatPricePKR(Number(displayProduct.price_max))}`
    : formatPricePKR(Number(displayProduct.price))

  if (
    options?.showWasPrice &&
    applyDiscount &&
    hasProductDiscount(product)
  ) {
    const originalText = isPriceRange(product)
      ? `${formatPricePKR(Number(product.price))} – ${formatPricePKR(Number(product.price_max))}`
      : formatPricePKR(Number(product.price))
    return `${saleText} (was ${originalText})${unitSuffix}`
  }

  return `${saleText}${unitSuffix}`
}

/** Prefix for range products on cards (e.g. "From") */
export function productPricePrefix(product: PriceFields): string | null {
  return isPriceRange(product) ? 'From' : null
}

/** Unit price used for order estimates (minimum of range, after discount) */
export function getOrderUnitPrice(product: DiscountableProduct): number {
  return getDiscountedPriceFields(product).price
}

export function getOrderLineTotal(
  product: DiscountableProduct,
  quantity: number,
): number {
  return getOrderUnitPrice(product) * quantity
}

export function getPriceRangeNote(): string {
  return 'Final price depends on size and grade. We will confirm the exact amount when we contact you.'
}
