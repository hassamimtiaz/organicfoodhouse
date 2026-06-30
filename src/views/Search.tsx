'use client'

import { useSearchParams } from 'next/navigation'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/skeletons/ProductGridSkeleton'
import { queryKeys } from '../lib/queryCache'
import { useCachedQuery } from '../lib/useCachedQuery'
import { searchProducts } from '../services/api'
import './Search.css'

export default function Search() {
  const params = useSearchParams()
  const q = params?.get('q') ?? ''
  const trimmed = q.trim()

  const { data: products, isLoading } = useCachedQuery(
    trimmed ? queryKeys.search(trimmed) : null,
    () => searchProducts(trimmed),
    { enabled: Boolean(trimmed) },
  )

  const results = products ?? []

  return (
    <div className="search-page">
      <div className="container">
        <header className="search-page-header">
          <h1>Search products</h1>
          <p>
            Use the search bar at the top to find what&apos;s in season — fruits,
            varieties, and more.
          </p>
        </header>

        {trimmed && isLoading && !products && (
          <ProductGridSkeleton count={6} />
        )}

        {trimmed && !isLoading && (
          <p className="search-results-count">
            {results.length} result{results.length !== 1 ? 's' : ''} for
            &ldquo;{q}&rdquo;
          </p>
        )}

        {trimmed && products && results.length > 0 && (
          <div className="product-grid">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {trimmed && products && results.length === 0 && !isLoading && (
          <p className="status-msg">No products match your search.</p>
        )}

        {!trimmed && (
          <p className="status-msg">
            Type a product name to search our seasonal catalog.
          </p>
        )}
      </div>
    </div>
  )
}
