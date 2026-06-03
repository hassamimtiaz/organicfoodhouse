import {
  formatProductPrice,
  getPriceRangeNote,
  isPriceRange,
  productPricePrefix,
} from '../config/pricing'
import { formatUnitLabel, hasUnitRange } from '../config/units'
import type { Product } from '../types'
import './ProductDetailPricing.css'

interface ProductDetailPricingProps {
  product: Pick<
    Product,
    | 'price'
    | 'price_max'
    | 'price_type'
    | 'unit'
    | 'unit_min'
    | 'unit_max'
    | 'in_stock'
  >
}

export default function ProductDetailPricing({ product }: ProductDetailPricingProps) {
  const priceRange = isPriceRange(product)
  const unitRange = hasUnitRange(product)
  const pricePrefix = productPricePrefix(product)
  const perUnit = product.unit.trim()
  const packLabel = formatUnitLabel(product)
  const priceDisplay = formatProductPrice(product)

  return (
    <div className="product-detail-pricing">
      <div className="pricing-highlight">
        {pricePrefix && (
          <span className="pricing-highlight-prefix">{pricePrefix}</span>
        )}
        <p className="pricing-highlight-amount">{priceDisplay}</p>
        <p className="pricing-highlight-per">
          per <span className="pricing-measure">{perUnit}</span>
        </p>
        {priceRange && (
          <span className="pricing-tag pricing-tag--range">Price range</span>
        )}
      </div>

      <dl className="pricing-facts">
        <div className="pricing-fact">
          <dt>Price</dt>
          <dd>
            {pricePrefix && <span className="pricing-fact-prefix">{pricePrefix} </span>}
            <strong>{priceDisplay}</strong>
            <span className="pricing-fact-muted"> / {perUnit}</span>
          </dd>
        </div>
        <div className="pricing-fact">
          <dt>{unitRange ? 'Typical pack size' : 'Sold by'}</dt>
          <dd>
            <strong>{packLabel}</strong>
          </dd>
        </div>
        {priceRange && (
          <div className="pricing-fact pricing-fact--note">
            <dt>Note</dt>
            <dd>{getPriceRangeNote()}</dd>
          </div>
        )}
      </dl>

      {!product.in_stock && (
        <p className="pricing-unavailable">Currently unavailable for order</p>
      )}
    </div>
  )
}
