import { getPriceRangeNote, isPriceRange } from '../config/pricing'
import { isProductOrderable } from '../config/preorder'
import { hasPackagings } from '../config/packaging'
import PackagingSelector from './PackagingSelector'
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
    | 'sold_out_mode'
    | 'packagings'
    | 'id'
  >
  selectedPackagingId?: string | null
  onPackagingChange?: (packagingId: string) => void
}

export default function ProductDetailPricing({
  product,
  selectedPackagingId = null,
  onPackagingChange,
}: ProductDetailPricingProps) {
  const priceRange = isPriceRange(product) && !hasPackagings(product)
  const packaged = hasPackagings(product)

  return (
    <div
      className={`product-detail-pricing${packaged ? ' product-detail-pricing--packaged' : ''}`}
    >
      {!packaged && (
        <ProductPrice product={product} size="large" layout="labeled" />
      )}
      {packaged && onPackagingChange && (
        <PackagingSelector
          product={product}
          value={selectedPackagingId}
          onChange={onPackagingChange}
          size="large"
        />
      )}
      {priceRange && (
        <p className="price-range-note">{getPriceRangeNote()}</p>
      )}
      {!isProductOrderable(product as Product) && (
        <p className="pricing-unavailable">Currently unavailable for order</p>
      )}
    </div>
  )
}
