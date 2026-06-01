import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatProductPrice } from '../config/pricing'
import { searchProducts } from '../services/api'
import type { Product } from '../types'
import './ProductSearch.css'

interface ProductSearchProps {
  variant?: 'header' | 'hero'
}

export default function ProductSearch({ variant = 'header' }: ProductSearchProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [query, setQuery] = useState(initial)
  const [results, setResults] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const items = await searchProducts(query)
        setResults(items.slice(0, 6))
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div
      ref={wrapRef}
      className={`product-search product-search--${variant}`}
    >
      <form onSubmit={handleSubmit} className="product-search-form" role="search">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search seasonal products…"
          aria-label="Search products"
          autoComplete="off"
        />
        <button type="submit" className="search-submit">
          Search
        </button>
      </form>

      {open && query.trim() && (
        <div className="search-dropdown">
          {loading ? (
            <p className="search-dropdown-msg">Searching…</p>
          ) : results.length === 0 ? (
            <p className="search-dropdown-msg">No products found</p>
          ) : (
            <ul>
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/product/${p.id}`}
                    onClick={() => setOpen(false)}
                  >
                    <span>{p.name}</span>
                    <span>{formatProductPrice(p)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to={`/search?q=${encodeURIComponent(query.trim())}`}
            className="search-view-all"
            onClick={() => setOpen(false)}
          >
            View all results →
          </Link>
        </div>
      )}
    </div>
  )
}
