import './Skeleton.css'
import './CategoryPageSkeleton.css'

type CategoryPageSkeletonProps = {
  subcategory?: boolean
}

export default function CategoryPageSkeleton({
  subcategory = false,
}: CategoryPageSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Loading category">
      <div className="skeleton category-page-skeleton-breadcrumbs" />
      <header className="category-page-skeleton-header">
        <div className="skeleton category-page-skeleton-image" />
        <div className="category-page-skeleton-copy">
          <div className="skeleton category-page-skeleton-eyebrow" />
          <div className="skeleton category-page-skeleton-title" />
          <div className="skeleton category-page-skeleton-line" />
          <div className="skeleton category-page-skeleton-count" />
        </div>
      </header>
      <div
        className={
          subcategory ? 'product-grid' : 'subcategory-grid category-page-skeleton-grid'
        }
      >
        {Array.from({ length: subcategory ? 6 : 4 }, (_, index) => (
          <div
            key={index}
            className={`skeleton ${subcategory ? 'category-page-skeleton-card--product' : 'category-page-skeleton-card'}`}
          />
        ))}
      </div>
    </div>
  )
}
