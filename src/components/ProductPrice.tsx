import { formatUnitLabel, getUnitRowLabel } from '../config/units'
import { formatPricePKR } from '../config/site'
import {
  getPackagingOriginalPriceRange,
  getPackagingPriceRange,
  hasPackagings,
} from '../config/packaging'
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
    | 'packagings'
  >
  /** large = product detail page */
  size?: 'default' | 'large'
  /** Show weight / unit on its own row */
  showUnit?: boolean
  /** labeled = Price + Weight rows; inline = single line (search, etc.) */
  layout?: 'labeled' | 'inline'
  className?: string
}

function formatRangeText(min: number, max: number): string {
  return min === max
    ? formatPricePKR(min)
    : `${formatPricePKR(min)} – ${formatPricePKR(max)}`
}

function formatSaleAmount(
  product: Pick<
    Product,
    'price' | 'price_max' | 'price_type' | 'packagings' | 'discount_percent'
  >,
  compact: boolean,
) {
  if (hasPackagings(product)) {
    const range = getPackagingPriceRange(product)
    if (!range) return formatPricePKR(0)
    // Cards: show starting sale price only — full range overflows.
    if (compact && range.min !== range.max) {
      return formatPricePKR(range.min)
    }
    return formatRangeText(range.min, range.max)
  }
  if (isPriceRange(product)) {
    const sale = getDiscountedPriceFields(product)
    if (compact) return formatPricePKR(sale.price)
    return formatRangeText(sale.price, Number(sale.price_max))
  }
  return formatPricePKR(getDiscountedPriceFields(product).price)
}

function formatOriginalAmount(
  product: Pick<
    Product,
    'price' | 'price_max' | 'price_type' | 'packagings' | 'discount_percent'
  >,
  compact: boolean,
) {
  if (hasPackagings(product)) {
    const range = getPackagingOriginalPriceRange(product)
    if (!range) return null
    if (compact) return formatPricePKR(range.min)
    return formatRangeText(range.min, range.max)
  }
  if (isPriceRange(product)) {
    if (compact) return formatPricePKR(Number(product.price))
    return formatRangeText(Number(product.price), Number(product.price_max))
  }
  return formatPricePKR(Number(product.price))
}

function PriceAmount({
  product,
  discounted,
  compact,
}: {
  product: ProductPriceProps['product']
  discounted: boolean
  compact: boolean
}) {
  const prefix = productPricePrefix(product)
  const range = isPriceRange(product) && !hasPackagings(product)
  const saleAmountText = formatSaleAmount(product, compact)
  const originalAmountText = discounted
    ? formatOriginalAmount(product, compact)
    : null
  const showFromPrefix =
    Boolean(prefix) ||
    (compact &&
      hasPackagings(product) &&
      (() => {
        const sale = getPackagingPriceRange(product)
        return sale != null && sale.min !== sale.max
      })())

  return (
    <span className={`price-amount-stack${discounted ? ' has-discount' : ''}`}>
      {discounted && (
        <span className="discount-badge" aria-label="Discount">
          {product.discount_percent}% off
        </span>
      )}
      <span className="price-amount-row">
        {showFromPrefix && <span className="price-prefix">From</span>}
        <span className="price-amount">{saleAmountText}</span>
        {discounted && originalAmountText && (
          <span className="price-original" aria-label="Original price">
            {originalAmountText}
          </span>
        )}
      </span>
      {range && (
        <span className="price-range-badge" aria-label="Price range">
          Price range
        </span>
      )}
    </span>
  )
}

export default function ProductPrice({
  product,
  size = 'default',
  showUnit = true,
  layout = 'labeled',
  className = '',
}: ProductPriceProps) {
  const discounted = hasProductDiscount(product)
  const range = isPriceRange(product) && !hasPackagings(product)
  const packaged = hasPackagings(product)
  const compact = size !== 'large'
  const unitLabel =
    showUnit && !packaged
      ? formatUnitLabel(product, { titleCaseMeasure: true })
      : ''
  const unitRowLabel = getUnitRowLabel(product)

  const rootClass = [
    'product-price-display',
    `product-price-display--${size}`,
    layout === 'labeled' ? 'product-price-display--labeled' : '',
    range ? 'is-range' : '',
    packaged ? 'has-packagings' : '',
    discounted ? 'has-discount' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (layout === 'inline') {
    const unitSuffix = unitLabel ? ` / ${unitLabel}` : ''
    const saleAmountText = formatSaleAmount(product, true)
    const originalAmountText = discounted
      ? formatOriginalAmount(product, true)
      : null
    const prefix = productPricePrefix(product)

    return (
      <span className={rootClass}>
        {discounted && (
          <span className="discount-badge" aria-label="Discount">
            {product.discount_percent}% off
          </span>
        )}
        {prefix && <span className="price-prefix">{prefix}</span>}
        <span className="price-amount">
          {saleAmountText}
          {unitSuffix}
        </span>
        {discounted && originalAmountText && (
          <span className="price-original" aria-label="Original price">
            {originalAmountText}
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

  return (
    <div className={rootClass}>
      <div className="product-price-line product-price-line--price">
        <span className="product-price-line-label">Price</span>
        <span className="product-price-line-value">
          <PriceAmount
            product={product}
            discounted={discounted}
            compact={compact}
          />
        </span>
      </div>
      {showUnit && packaged && (
        <div className="product-price-line product-price-line--unit">
          <span className="product-price-line-label">Options</span>
          <span className="product-price-line-value product-price-line-value--unit">
            Multiple box sizes
          </span>
        </div>
      )}
      {showUnit && unitLabel && (
        <div className="product-price-line product-price-line--unit">
          <span className="product-price-line-label">{unitRowLabel}</span>
          <span className="product-price-line-value product-price-line-value--unit">
            {unitLabel}
          </span>
        </div>
      )}
    </div>
  )
}
