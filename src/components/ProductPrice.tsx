import { formatUnitLabel, getUnitRowLabel } from '../config/units'
import { formatPricePKR } from '../config/site'
import {
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

function formatAmount(
  product: Pick<
    Product,
    'price' | 'price_max' | 'price_type' | 'packagings' | 'discount_percent'
  >,
) {
  if (hasPackagings(product)) {
    const range = getPackagingPriceRange(product)
    if (range) {
      return range.min === range.max
        ? formatPricePKR(range.min)
        : `${formatPricePKR(range.min)} – ${formatPricePKR(range.max)}`
    }
  }
  if (isPriceRange(product)) {
    return `${formatPricePKR(Number(product.price))} – ${formatPricePKR(Number(product.price_max))}`
  }
  return formatPricePKR(Number(product.price))
}

function PriceAmount({
  product,
  discounted,
}: {
  product: ProductPriceProps['product']
  discounted: boolean
}) {
  const prefix = productPricePrefix(product)
  const range = isPriceRange(product)
  const salePrices = getDiscountedPriceFields(product)
  const saleAmountText = range
    ? `${formatPricePKR(salePrices.price)} – ${formatPricePKR(salePrices.price_max!)}`
    : formatPricePKR(salePrices.price)
  const originalAmountText = discounted ? formatAmount(product) : null

  return (
    <>
      {prefix && <span className="price-prefix">{prefix}</span>}
      {discounted && originalAmountText && (
        <span className="price-original" aria-label="Original price">
          {originalAmountText}
        </span>
      )}
      <span className="price-amount">
        {discounted ? saleAmountText : formatAmount(product)}
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
    </>
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
    const salePrices = getDiscountedPriceFields(product)
    const saleAmountText = packaged
      ? formatAmount(product)
      : range
        ? `${formatPricePKR(salePrices.price)} – ${formatPricePKR(salePrices.price_max!)}`
        : formatPricePKR(salePrices.price)
    const originalAmountText = discounted ? formatAmount(product) : null
    const prefix = productPricePrefix(product)

    return (
      <span className={rootClass}>
        {prefix && <span className="price-prefix">{prefix}</span>}
        {discounted && originalAmountText && (
          <span className="price-original" aria-label="Original price">
            {originalAmountText}
            {unitSuffix}
          </span>
        )}
        <span className="price-amount">
          {discounted
            ? `${saleAmountText}${unitSuffix}`
            : `${formatAmount(product)}${unitSuffix}`}
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

  return (
    <div className={rootClass}>
      <div className="product-price-line product-price-line--price">
        <span className="product-price-line-label">Price</span>
        <span className="product-price-line-value">
          <PriceAmount product={product} discounted={discounted} />
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
