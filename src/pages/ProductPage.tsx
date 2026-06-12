import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductGridSection from '../components/ProductGridSection'
import PreorderStatus from '../components/PreorderStatus'
import ProductDetailPricing from '../components/ProductDetailPricing'
import DeliveryNotice from '../components/DeliveryNotice'
import ProductOrderModal from '../components/ProductOrderModal'
import Seo from '../components/Seo'
import {
  acceptsPreorder,
  isComingSoonProduct,
} from '../config/preorder'
import { hasProductDiscount } from '../config/pricing'
import { SITE, whatsappLink } from '../config/site'
import { fetchProductRecommendations } from '../services/api'
import { getProductUrl } from '../lib/productSlug'
import {
  fetchProductBySlugOrId,
  getProductCategoryPath,
} from '../services/ordersApi'
import type { PlaceOrderFormData, Product } from '../types'
import './ProductPage.css'

function slugToLabel(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function ProductPage() {
  const { slug: urlRef } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [categoryPath, setCategoryPath] = useState<{
    parentSlug: string
    subSlug: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [submittedForm, setSubmittedForm] = useState<PlaceOrderFormData | null>(
    null,
  )
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [alsoLikeProducts, setAlsoLikeProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!urlRef) return

    const ref = urlRef

    async function load() {
      setLoading(true)
      setError(null)
      setRelatedProducts([])
      setAlsoLikeProducts([])
      try {
        const p = await fetchProductBySlugOrId(ref)
        if (!p) {
          setError('Product not found')
          return
        }
        setProduct(p)
        if (urlRef !== p.slug) {
          window.history.replaceState(null, '', getProductUrl(p))
        }
        const path = await getProductCategoryPath(p)
        setCategoryPath(path)

        const { related, alsoLike } = await fetchProductRecommendations(p)
        setRelatedProducts(related)
        setAlsoLikeProducts(alsoLike)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [urlRef])

  const comingSoon = product ? isComingSoonProduct(product) : false
  const canPreorder = product ? acceptsPreorder(product) : false
  const isPreorderFlow = comingSoon && canPreorder
  const detailBadge = product
    ? comingSoon
      ? 'Coming soon · Pre-order open'
      : hasProductDiscount(product)
        ? `${product.discount_percent}% OFF`
        : null
    : null

  const whatsappMsg = product
    ? isPreorderFlow
      ? `Hi! I want to pre-order ${product.name} from Organic Food House.`
      : `Hi! I want to order ${product.name} from Organic Food House.`
    : ''

  function handleOrderSuccess(form: PlaceOrderFormData) {
    setSubmittedForm(form)
    setOrderSuccess(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="product-page">
        <div className="container">
          <p className="status-msg">Loading product…</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-page">
        <div className="container">
          <p className="status-msg error">{error ?? 'Product not found'}</p>
          <Link to="/" className="btn btn-primary">
            Back to shop
          </Link>
        </div>
      </div>
    )
  }

  const breadcrumbItems = [
    { label: 'Shop', to: '/' },
    ...(categoryPath
      ? [
          {
            label: slugToLabel(categoryPath.parentSlug),
            to: `/category/${categoryPath.parentSlug}`,
          },
          {
            label: slugToLabel(categoryPath.subSlug),
            to: `/category/${categoryPath.parentSlug}/${categoryPath.subSlug}`,
          },
        ]
      : []),
    { label: product.name },
  ]

  const subcategoryLabel = categoryPath
    ? slugToLabel(categoryPath.subSlug)
    : null

  const recommendations =
    relatedProducts.length > 0 || alsoLikeProducts.length > 0 ? (
      <div className="product-recommendations">
        <ProductGridSection
          title="Related products"
          description={
            subcategoryLabel
              ? `More varieties from ${subcategoryLabel} you might enjoy.`
              : 'More items from this collection.'
          }
          products={relatedProducts}
          viewAll={
            categoryPath
              ? {
                  label: `View all ${subcategoryLabel ?? 'products'}`,
                  to: `/category/${categoryPath.parentSlug}/${categoryPath.subSlug}`,
                }
              : undefined
          }
        />
        <ProductGridSection
          title="You may also like"
          description="Other seasonal picks from our catalog."
          products={alsoLikeProducts}
          viewAll={
            categoryPath
              ? {
                  label: `Browse ${slugToLabel(categoryPath.parentSlug)}`,
                  to: `/category/${categoryPath.parentSlug}`,
                }
              : { label: 'Browse shop', to: '/' }
          }
        />
      </div>
    ) : null

  return (
    <div className="product-page">
      <Seo
        title={`Buy ${product.name} Online`}
        description={
          product.description ??
          `Order fresh organic ${product.name} from ${SITE.name}.${
            hasProductDiscount(product)
              ? ` Pre-order with ${product.discount_percent}% off`
              : ' Pre-order available'
          } — delivered across ${SITE.deliveryArea}.`
        }
        path={getProductUrl(product)}
      />

      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />

        {orderSuccess && submittedForm ? (
          <div className="order-success">
            <span className="success-icon" aria-hidden="true">
              ✓
            </span>
            <h1>
              {isPreorderFlow
                ? 'Pre-order placed successfully!'
                : 'Order placed successfully!'}
            </h1>
            <p>
              Thank you, {submittedForm.customer_name}. We received your{' '}
              {isPreorderFlow ? 'pre-order' : 'order'} for{' '}
              <strong>{product.name}</strong> and will contact you on{' '}
              <strong>{submittedForm.phone}</strong> to confirm delivery.
            </p>
            <div className="hero-actions">
              <Link
                to={
                  categoryPath
                    ? `/category/${categoryPath.parentSlug}/${categoryPath.subSlug}`
                    : '/'
                }
                className="btn btn-primary"
              >
                Continue shopping
              </Link>
              <a
                href={whatsappLink(
                  `Hi, I placed a website ${isPreorderFlow ? 'pre-order' : 'order'} for ${product.name}. My phone is ${submittedForm.phone}.`,
                )}
                className="btn btn-outline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Message on WhatsApp
              </a>
            </div>

            {(relatedProducts.length > 0 || alsoLikeProducts.length > 0) && (
              <div className="product-recommendations product-recommendations--success">
                <ProductGridSection
                  title="Related products"
                  products={relatedProducts}
                />
                <ProductGridSection
                  title="You may also like"
                  products={alsoLikeProducts}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="product-detail-grid">
            <div className="product-detail-visual">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <span className="product-detail-emoji" aria-hidden="true">
                  🥭
                </span>
              )}
              {detailBadge && (
                <span
                  className={`product-detail-badge ${comingSoon ? 'product-detail-badge--soon' : ''}`}
                >
                  {detailBadge}
                </span>
              )}
            </div>

            <div className="product-detail-info">
              <p className="product-detail-origin">
                Organic · Seasonal · {SITE.deliveryArea}
              </p>
              <h1>{product.name}</h1>
              {product.description && (
                <p className="product-detail-desc">{product.description}</p>
              )}

              <PreorderStatus product={product} variant="detail" />

              <div className="product-detail-price-box">
                <ProductDetailPricing product={product} />
              </div>

              <DeliveryNotice compact />

              {product.in_stock && (
                <div className="product-order-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-order-primary"
                    onClick={() => setOrderModalOpen(true)}
                  >
                    {isPreorderFlow
                      ? 'Pre-order on website'
                      : 'Order on website'}
                  </button>
                  <div className="product-order-actions-secondary">
                    <a
                      href={whatsappLink(whatsappMsg)}
                      className="btn btn-outline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {isPreorderFlow
                        ? 'Pre-order on WhatsApp'
                        : 'Order on WhatsApp'}
                    </a>
                    <a
                      href={`tel:${SITE.phoneTel}`}
                      className="btn btn-outline"
                    >
                      Call for inquiry — {SITE.phone}
                    </a>
                  </div>
                </div>
              )}

              {!product.in_stock && (
                <p className="out-stock-label product-out-stock-block">
                  Currently unavailable — contact us for availability.
                </p>
              )}
            </div>
          </div>
        )}

        {!orderSuccess && recommendations}
      </div>

      {product.in_stock && (
        <ProductOrderModal
          open={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          product={product}
          isPreorder={isPreorderFlow}
          onSuccess={handleOrderSuccess}
        />
      )}
    </div>
  )
}
