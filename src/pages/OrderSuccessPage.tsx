import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import ProductGridSection from '../components/ProductGridSection'
import Seo from '../components/Seo'
import { SITE, whatsappLink } from '../config/site'
import {
  clearOrderSuccessPayload,
  formatOrderProductList,
  loadOrderSuccessPayload,
} from '../lib/orderSuccessStorage'
import { fetchProductRecommendations } from '../services/api'
import { fetchProductBySlugOrId } from '../services/ordersApi'
import type { OrderSuccessPayload, Product } from '../types'
import './OrderSuccessPage.css'

function slugToLabel(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function OrderSuccessPage() {
  const [payload] = useState<OrderSuccessPayload | null>(() =>
    loadOrderSuccessPayload(),
  )
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [subcategoryLabel, setSubcategoryLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!payload?.productIds.length) return

    async function loadRecommendations() {
      const anchor = await fetchProductBySlugOrId(payload!.productIds[0])
      if (!anchor) return

      const { related, alsoLike } = await fetchProductRecommendations(anchor)
      const orderedIds = new Set(payload!.productIds)
      const seen = new Set<string>()
      const items: Product[] = []

      for (const p of [...related, ...alsoLike]) {
        if (orderedIds.has(p.id) || seen.has(p.id)) continue
        seen.add(p.id)
        items.push(p)
      }

      setRecommendations(items)

      if (payload!.categoryPath) {
        setSubcategoryLabel(slugToLabel(payload!.categoryPath.subSlug))
      }
    }

    void loadRecommendations()
  }, [payload])

  useEffect(() => {
    return () => {
      clearOrderSuccessPayload()
    }
  }, [])

  if (!payload) {
    return <Navigate to="/" replace />
  }

  const productSummary = formatOrderProductList(payload.productNames)
  const whatsappProducts =
    payload.productNames.length === 1
      ? payload.productNames[0]
      : `${payload.productNames.length} items`

  return (
    <div className="order-success-page">
      <Seo
        title="Order placed"
        description={`Thank you for your order at ${SITE.name}.`}
        path="/order/success"
      />

      <div className="container">
        <div className="order-success">
          <span className="success-icon" aria-hidden="true">
            ✓
          </span>
          <h1>
            {payload.isPreorder
              ? 'Pre-order placed successfully!'
              : 'Order placed successfully!'}
          </h1>
          <p>
            Thank you, {payload.customerName}. We received your{' '}
            {payload.isPreorder ? 'pre-order' : 'order'} for{' '}
            <strong>{productSummary}</strong> and will contact you on{' '}
            <strong>{payload.phone}</strong> to confirm delivery.
          </p>
          <div className="order-success-actions">
            <Link
              to={
                payload.categoryPath
                  ? `/category/${payload.categoryPath.parentSlug}/${payload.categoryPath.subSlug}`
                  : '/'
              }
              className="btn btn-primary"
            >
              Continue shopping
            </Link>
            <a
              href={whatsappLink(
                `Hi, I placed a website ${payload.isPreorder ? 'pre-order' : 'order'} for ${whatsappProducts}. My phone is ${payload.phone}.`,
              )}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="product-recommendations product-recommendations--success">
            <ProductGridSection
              title="More you might like"
              products={recommendations}
              viewAll={
                payload.categoryPath
                  ? {
                      label: `View all ${subcategoryLabel ?? 'products'}`,
                      to: `/category/${payload.categoryPath.parentSlug}/${payload.categoryPath.subSlug}`,
                    }
                  : { label: 'Browse shop', to: '/' }
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
