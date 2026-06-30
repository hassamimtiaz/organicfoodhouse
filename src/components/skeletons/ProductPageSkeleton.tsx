import './Skeleton.css'
import './ProductPageSkeleton.css'

export default function ProductPageSkeleton() {
  return (
    <div className="product-page product-page-skeleton" aria-busy="true" aria-label="Loading product">
      <div className="container">
        <div className="skeleton product-page-skeleton-breadcrumbs" />
        <div className="product-page-skeleton-grid">
          <div className="skeleton product-page-skeleton-gallery" />
          <div className="product-page-skeleton-info">
            <div className="skeleton product-page-skeleton-origin" />
            <div className="skeleton product-page-skeleton-title" />
            <div className="skeleton product-page-skeleton-line" />
            <div className="skeleton product-page-skeleton-line" />
            <div className="skeleton product-page-skeleton-line product-page-skeleton-line--short" />
            <div className="skeleton product-page-skeleton-price" />
            <div className="skeleton product-page-skeleton-packaging" />
            <div className="product-page-skeleton-actions">
              <div className="skeleton product-page-skeleton-btn" />
              <div className="skeleton product-page-skeleton-btn" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
