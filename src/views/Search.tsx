'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '../components/ProductCard'
import { searchProducts } from '../services/api'
import type { Product } from '../types'
import './Search.css'

export default function Search() {
  const params = useSearchParams()
  const q = params?.get('q') ?? ''
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function run() {
      if (!q.trim()) {
        setProducts([])
        return
      }
      setLoading(true)
      try {
        setProducts(await searchProducts(q))
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [q])

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

        {loading && <p className="status-msg">Searching…</p>}

        {!loading && q.trim() && (
          <p className="search-results-count">
            {products.length} result{products.length !== 1 ? 's' : ''} for
            &ldquo;{q}&rdquo;
          </p>
        )}

        {!loading && q.trim() && products.length > 0 && (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {!loading && q.trim() && products.length === 0 && (
          <p className="status-msg">No products match your search.</p>
        )}

        {!q.trim() && (
          <p className="status-msg">
            Type a product name to search our seasonal catalog.
          </p>
        )}
      </div>
    </div>
  )
}
