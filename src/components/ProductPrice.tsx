import {
  formatProductPrice,
  isPriceRange,
  productPricePrefix,
} from '../config/pricing'
import type { Product } from '../types'
import './ProductPrice.css'

interface ProductPriceProps {
  product: Pick<Product, 'price' | 'price_max' | 'price_type' | 'unit'>
  /** large = product detail page */
  size?: 'default' | 'large'
  showUnit?: boolean
  className?: string
}

export default function ProductPrice({
  product,
  size = 'default',
  showUnit = true,
  className = '',
}: ProductPriceProps) {
  const prefix = productPricePrefix(product)
  const range = isPriceRange(product)

  return (
    <span
      className={`product-price-display product-price-display--${size} ${range ? 'is-range' : ''} ${className}`.trim()}
    >
      {prefix && <span className="price-prefix">{prefix}</span>}
      <span className="price-amount">
        {formatProductPrice(product, {
          includeUnit: showUnit ? product.unit : undefined,
        })}
      </span>
      {range && (
        <span className="price-range-badge" aria-label="Price range">
          Price range
        </span>
      )}
    </span>
  )
}
