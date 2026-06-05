import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import { SITE } from '../config/site'
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

export default function CategoryPage() {
  const { slug, subcategorySlug } = useParams<{
    slug: string
    subcategorySlug?: string
  }>()

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

  const seoTitle = subcategory
    ? `Buy ${subcategory.name} Online`
    : category
      ? `${category.name} — Organic`
      : 'Shop'
  const seoPath = subcategory
    ? `/category/${slug}/${subcategorySlug}`
    : `/category/${slug}`

  return (
    <div className="category-page">
      <Seo
        title={seoTitle}
        description={`Shop ${subcategory?.name ?? category?.name ?? 'seasonal organic'} at ${SITE.name}. Pre-order seasonal items — discounts shown on each product. Delivered across ${SITE.deliveryArea}.`}
        path={seoPath}
      />
      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />

        {loading && <p className="status-msg">Loading…</p>}

        {error && (
          <div className="empty-state">
            <p className="status-msg error">{error}</p>
            <Link to="/" className="btn btn-primary">
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
                  alt=""
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
                  alt=""
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
                  {products.length} variety
                  {products.length !== 1 ? 'ies' : ''}
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
    </div>
  )
}
