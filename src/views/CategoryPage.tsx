'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '../components/Breadcrumbs'
import JsonLdScript from '../components/JsonLdScript'
import MangoSeoContent from '../components/MangoSeoContent'
import { buildBreadcrumbListSchema } from '../lib/seo'
import ProductCard from '../components/ProductCard'
import SubcategoryCard from '../components/SubcategoryCard'
import {
  fetchCategoryBySlug,
  fetchProductsBySubcategory,
  fetchSubcategories,
  fetchSubcategoryBySlug,
} from '../services/api'
import type { Category, Product } from '../types'
import './CategoryPage.css'

export default function CategoryPage({
  slug,
  subcategorySlug,
}: {
  slug: string
  subcategorySlug?: string
}) {

  const [category, setCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [subcategory, setSubcategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isSubcategoryView = Boolean(subcategorySlug)

  useEffect(() => {
    if (!slug) return
    const categorySlug = slug

    async function load() {
      setLoading(true)
      setError(null)

      try {
        if (subcategorySlug) {
          const result = await fetchSubcategoryBySlug(
            categorySlug,
            subcategorySlug,
          )
          if (!result) {
            setError('Subcategory not found')
            return
          }
          setCategory(result.parent)
          setSubcategory(result.subcategory)
          const items = await fetchProductsBySubcategory(result.subcategory.id)
          setProducts(items)
          setSubcategories([])
        } else {
          const cat = await fetchCategoryBySlug(categorySlug)
          if (!cat) {
            setError('Category not found')
            return
          }
          setCategory(cat)
          setSubcategory(null)
          setProducts([])

          const subs = await fetchSubcategories(cat.id)
          setSubcategories(subs)

          const counts: Record<string, number> = {}
          await Promise.all(
            subs.map(async (sub) => {
              const items = await fetchProductsBySubcategory(sub.id)
              counts[sub.id] = items.length
            }),
          )
          setProductCounts(counts)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [slug, subcategorySlug])

  const breadcrumbItems = [
    { label: 'Shop', to: '/' },
    ...(category
      ? [
          {
            label: category.name,
            to: isSubcategoryView ? `/category/${category.slug}` : undefined,
          },
        ]
      : []),
    ...(subcategory ? [{ label: subcategory.name }] : []),
  ]

  return (
    <div className="category-page">
      <JsonLdScript
        id="json-ld-breadcrumbs"
        data={buildBreadcrumbListSchema(breadcrumbItems)}
      />
      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />

        {loading && <p className="status-msg">Loading…</p>}

        {error && (
          <div className="empty-state">
            <p className="status-msg error">{error}</p>
            <Link href="/" className="btn btn-primary">
              Go home
            </Link>
          </div>
        )}

        {!loading && !error && category && !isSubcategoryView && (
          <>
            <header className="category-header">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="category-page-image"
                />
              ) : (
                <span className="category-page-icon" aria-hidden="true">
                  🍎
                </span>
              )}
              <div>
                <h1>{category.name}</h1>
                {category.description && <p>{category.description}</p>}
                <span className="product-count">
                  {subcategories.length} subcategor
                  {subcategories.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
            </header>

            {subcategories.length === 0 ? (
              <div className="empty-state">
                <p>No subcategories available yet. Check back soon.</p>
              </div>
            ) : (
              <div className="subcategory-grid">
                {subcategories.map((sub) => (
                  <SubcategoryCard
                    key={sub.id}
                    parentSlug={category.slug}
                    subcategory={sub}
                    productCount={productCounts[sub.id] ?? 0}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && category && subcategory && (
          <>
            <header className="category-header">
              {subcategory.image_url ? (
                <img
                  src={subcategory.image_url}
                  alt={subcategory.name}
                  className="category-page-image"
                />
              ) : (
                <span className="category-page-icon" aria-hidden="true">
                  🥭
                </span>
              )}
              <div>
                <p className="category-parent-label">{category.name}</p>
                <h1>{subcategory.name}</h1>
                {subcategory.description && (
                  <p>{subcategory.description}</p>
                )}
                <span className="product-count">
                  {products.length}
                  {products.length && products.length !== 1 ? ' Varieties' : ' Variety'}
                </span>
              </div>
            </header>

            {products.length === 0 ? (
              <div className="empty-state">
                <p>No products in this subcategory yet. Check back soon.</p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {subcategorySlug === 'mangoes' && !loading && !error && (
        <MangoSeoContent variant="category" />
      )}
    </div>
  )
}
