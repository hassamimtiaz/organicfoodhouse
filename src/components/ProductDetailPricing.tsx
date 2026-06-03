import { getPriceRangeNote, isPriceRange } from '../config/pricing'
import type { Product } from '../types'
import ProductPrice from './ProductPrice'
import './ProductDetailPricing.css'

interface ProductDetailPricingProps {
  product: Pick<
    Product,
    | 'price'
    | 'price_max'
    | 'price_type'
    | 'discount_percent'
    | 'unit'
    | 'unit_min'
    | 'unit_max'
    | 'in_stock'
  >
}

export default function ProductDetailPricing({ product }: ProductDetailPricingProps) {
  const priceRange = isPriceRange(product)

  return (
    <div className="product-detail-pricing">
      <ProductPrice product={product} size="large" layout="labeled" />
      {priceRange && (
        <p className="price-range-note">{getPriceRangeNote()}</p>
      )}
      {!product.in_stock && (
        <p className="pricing-unavailable">Currently unavailable for order</p>
      )}
    </div>
  )
}
