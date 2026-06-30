import ProductCardSkeleton from './ProductCardSkeleton'

type ProductGridSkeletonProps = {
  count?: number
  compact?: boolean
  className?: string
}

export default function ProductGridSkeleton({
  count = 8,
  compact = false,
  className = '',
}: ProductGridSkeletonProps) {
  return (
    <div
      className={`product-grid${compact ? ' product-grid--shop' : ''} ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} compact={compact} />
      ))}
    </div>
  )
}
