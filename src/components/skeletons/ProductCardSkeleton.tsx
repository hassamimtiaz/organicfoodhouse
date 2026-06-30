import './Skeleton.css'
import './ProductCardSkeleton.css'

type ProductCardSkeletonProps = {
  compact?: boolean
}

export default function ProductCardSkeleton({
  compact = false,
}: ProductCardSkeletonProps) {
  return (
    <article
      className={`product-card-skeleton${compact ? ' product-card-skeleton--compact' : ''}`}
      aria-hidden="true"
    >
      <div className="skeleton product-card-skeleton-visual" />
      <div className="product-card-skeleton-body">
        <div className="skeleton product-card-skeleton-title" />
        {!compact && (
          <>
            <div className="skeleton product-card-skeleton-line" />
            <div className="skeleton product-card-skeleton-line product-card-skeleton-line--short" />
          </>
        )}
        <div className="skeleton product-card-skeleton-price" />
        <div className="product-card-skeleton-actions">
          <div className="skeleton product-card-skeleton-btn" />
          <div className="skeleton product-card-skeleton-btn" />
        </div>
      </div>
    </article>
  )
}
