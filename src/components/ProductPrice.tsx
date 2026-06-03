import { formatUnitLabel } from '../config/units'
import { formatPricePKR } from '../config/site'
import {
  getDiscountedPriceFields,
  hasProductDiscount,
  isPriceRange,
  productPricePrefix,
} from '../config/pricing'
import type { Product } from '../types'
import './ProductPrice.css'

interface ProductPriceProps {
  product: Pick<
    Product,
    | 'price'
    | 'price_max'
    | 'price_type'
    | 'discount_percent'
    | 'unit'
    | 'unit_min'
    | 'unit_max'
  >
  /** large = product detail page */
  size?: 'default' | 'large'
  showUnit?: boolean
  className?: string
}

function formatAmount(
  product: Pick<Product, 'price' | 'price_max' | 'price_type'>,
) {
  if (isPriceRange(product)) {
    return `${formatPricePKR(Number(product.price))} – ${formatPricePKR(Number(product.price_max))}`
  }
  return formatPricePKR(Number(product.price))
}

export default function ProductPrice({
  product,
  size = 'default',
  showUnit = true,
  className = '',
}: ProductPriceProps) {
  const prefix = productPricePrefix(product)
  const range = isPriceRange(product)
  const discounted = hasProductDiscount(product)
  const salePrices = getDiscountedPriceFields(product)
  const unitLabel = showUnit ? formatUnitLabel(product) : ''
  const unitSuffix = unitLabel ? ` / ${unitLabel}` : ''

  const saleAmountText = range
    ? `${formatPricePKR(salePrices.price)} – ${formatPricePKR(salePrices.price_max!)}`
    : formatPricePKR(salePrices.price)

  const originalAmountText = discounted ? formatAmount(product) : null

  return (
    <span
      className={`product-price-display product-price-display--${size} ${range ? 'is-range' : ''} ${discounted ? 'has-discount' : ''} ${className}`.trim()}
    >
      {prefix && <span className="price-prefix">{prefix}</span>}
      {discounted && originalAmountText && (
        <span className="price-original" aria-label="Original price">
          {originalAmountText}
          {unitSuffix}
        </span>
      )}
      <span className="price-amount">
        {discounted ? `${saleAmountText}${unitSuffix}` : `${formatAmount(product)}${unitSuffix}`}
      </span>
      {discounted && (
        <span className="discount-badge" aria-label="Discount">
          {product.discount_percent}% off
        </span>
      )}
      {range && (
        <span className="price-range-badge" aria-label="Price range">
          Price range
        </span>
      )}
    </span>
  )
}
