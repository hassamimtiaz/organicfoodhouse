import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchSubcategories,
  fetchTopLevelCategories,
} from '../services/api'
import type { Category } from '../types'
import './NavProducts.css'

function NavChevron({ expanded }: { expanded?: boolean }) {
  return (
    <svg
      className={`nav-chevron ${expanded ? 'is-expanded' : ''}`}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5.25L7 8.25L10 5.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function NavProducts() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Record<string, Category[]>>(
    {},
  )
  const [loading, setLoading] = useState(true)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const top = await fetchTopLevelCategories()
        setCategories(top)
        const subs: Record<string, Category[]> = {}
        await Promise.all(
          top.map(async (cat) => {
            subs[cat.id] = await fetchSubcategories(cat.id)
          }),
        )
        setSubcategories(subs)
        if (top.length > 0) {
          setExpanded({ [top[0].id]: true })
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function toggleCategory(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div ref={wrapRef} className="nav-products">
      <button
        type="button"
        className={`nav-products-trigger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <span>Products</span>
        <span className="nav-trigger-chevron" aria-hidden="true">
          <NavChevron expanded={menuOpen} />
        </span>
      </button>

      {menuOpen && (
        <div className="nav-products-dropdown" role="menu">
          {loading ? (
            <p className="nav-products-loading">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="nav-products-loading">No categories yet</p>
          ) : (
            <ul className="nav-products-list">
              {categories.map((cat) => {
                const subs = subcategories[cat.id] ?? []
                const isExpanded = expanded[cat.id]
                const hasSubs = subs.length > 0

                return (
                  <li key={cat.id} className="nav-products-category">
                    <div className="nav-category-row">
                      {hasSubs ? (
                        <button
                          type="button"
                          className="nav-expand-btn"
                          onClick={() => toggleCategory(cat.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${cat.name}`}
                        >
                          <NavChevron expanded={isExpanded} />
                        </button>
                      ) : (
                        <span className="nav-expand-spacer" aria-hidden="true" />
                      )}

                      <Link
                        to={`/category/${cat.slug}`}
                        className="nav-category-name"
                        onClick={closeMenu}
                        role="menuitem"
                      >
                        {cat.name}
                      </Link>
                    </div>

                    {hasSubs && (
                      <ul
                        className={`nav-subcategory-list ${isExpanded ? 'is-open' : ''}`}
                        hidden={!isExpanded}
                      >
                        {subs.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              to={`/category/${cat.slug}/${sub.slug}`}
                              onClick={closeMenu}
                              role="menuitem"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
