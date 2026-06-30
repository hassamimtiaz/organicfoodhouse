'use client'

import Link from 'next/link'
import Breadcrumbs from '../components/Breadcrumbs'
import JsonLdScript from '../components/JsonLdScript'
import MangoSeoContent from '../components/MangoSeoContent'
import { buildBreadcrumbListSchema } from '../lib/seo'
import ProductCard from '../components/ProductCard'
import SubcategoryCard from '../components/SubcategoryCard'
import CategoryPageSkeleton from '../components/skeletons/CategoryPageSkeleton'
import { queryKeys } from '../lib/queryCache'
import { useCachedQuery } from '../lib/useCachedQuery'
import {
  fetchCategoryBySlug,
  fetchProductsBySubcategory,
  fetchSubcategories,
  fetchSubcategoryBySlug,
} from '../services/api'
import type { Category, Product } from '../types'
import './CategoryPage.css'

type CategoryViewData = {
  category: Category
  subcategories: Category[]
  productCounts: Record<string, number>
}

type SubcategoryViewData = {
  category: Category
  subcategory: Category
  products: Product[]
}

async function loadCategoryPageData(
  slug: string,
  subcategorySlug?: string,
): Promise<CategoryViewData | SubcategoryViewData> {
  if (subcategorySlug) {
    const result = await fetchSubcategoryBySlug(slug, subcategorySlug)
    if (!result) {
      throw new Error('Subcategory not found')
    }
    const items = await fetchProductsBySubcategory(result.subcategory.id)
    return {
      category: result.parent,
      subcategory: result.subcategory,
      products: items,
    }
  }

  const cat = await fetchCategoryBySlug(slug)
  if (!cat) {
    throw new Error('Category not found')
  }

  const subs = await fetchSubcategories(cat.id)
  const counts: Record<string, number> = {}
  await Promise.all(
    subs.map(async (sub) => {
      const items = await fetchProductsBySubcategory(sub.id)
      counts[sub.id] = items.length
    }),
  )

  return {
    category: cat,
    subcategories: subs,
    productCounts: counts,
  }
}

function isSubcategoryData(
  data: CategoryViewData | SubcategoryViewData,
): data is SubcategoryViewData {
  return 'subcategory' in data
}

export default function CategoryPage({
  slug,
  subcategorySlug,
}: {
  slug: string
  subcategorySlug?: string
}) {
  const cacheKey = subcategorySlug
    ? queryKeys.subcategory(slug, subcategorySlug)
    : queryKeys.category(slug)

  const { data, isLoading, error } = useCachedQuery(
    slug ? cacheKey : null,
    () => loadCategoryPageData(slug, subcategorySlug),
    { enabled: Boolean(slug) },
  )

  const isSubcategoryView = Boolean(subcategorySlug)
  const category = data?.category ?? null
  const subcategory = data && isSubcategoryData(data) ? data.subcategory : null
  const subcategories =
    data && !isSubcategoryData(data) ? data.subcategories : []
  const productCounts =
    data && !isSubcategoryData(data) ? data.productCounts : {}
  const products = data && isSubcategoryData(data) ? data.products : []

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

        {isLoading && !data && (
          <CategoryPageSkeleton subcategory={isSubcategoryView} />
        )}

        {error && !data && (
          <div className="empty-state">
            <p className="status-msg error">{error.message}</p>
            <Link href="/" className="btn btn-primary">
              Go home
            </Link>
          </div>
        )}

        {data && category && !isSubcategoryView && (
          <>
            <header className="category-header">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="category-page-image"
                  loading="lazy"
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

        {data && category && subcategory && (
          <>
            <header className="category-header">
              {subcategory.image_url ? (
                <img
                  src={subcategory.image_url}
                  alt={subcategory.name}
                  className="category-page-image"
                  loading="lazy"
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

      {subcategorySlug === 'mangoes' && data && !error && (
        <MangoSeoContent variant="category" />
      )}
    </div>
  )
}
