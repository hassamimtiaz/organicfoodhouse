import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductGridSection from '../components/ProductGridSection'
import PreorderStatus from '../components/PreorderStatus'
import ProductPrice from '../components/ProductPrice'
import Seo from '../components/Seo'
import {
  acceptsPreorder,
  isComingSoonProduct,
} from '../config/preorder'
import {
  getOrderLineTotal,
  getPriceRangeNote,
  isPriceRange,
} from '../config/pricing'
import { formatUnitLabel } from '../config/units'
import { SITE, formatPricePKR, whatsappLink } from '../config/site'
import { fetchProductRecommendations } from '../services/api'
import {
  fetchProductById,
  getProductCategoryPath,
  placeOrder,
} from '../services/ordersApi'
import type { PlaceOrderFormData, Product } from '../types'
import './ProductPage.css'

const emptyOrderForm: PlaceOrderFormData = {
  customer_name: '',
  phone: '',
  email: '',
  address_line: '',
  city: '',
  notes: '',
  quantity: 1,
}

function slugToLabel(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [categoryPath, setCategoryPath] = useState<{
    parentSlug: string
    subSlug: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<PlaceOrderFormData>(emptyOrderForm)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [alsoLikeProducts, setAlsoLikeProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!id) return

    async function load() {
      setLoading(true)
      setError(null)
      setRelatedProducts([])
      setAlsoLikeProducts([])
      try {
        const p = await fetchProductById(id!)
        if (!p) {
          setError('Product not found')
          return
        }
        setProduct(p)
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
  }, [id])

  const lineTotal = product
    ? getOrderLineTotal(product, form.quantity)
    : 0
  const priceIsRange = product ? isPriceRange(product) : false
  const unitLabel = product ? formatUnitLabel(product) : ''
  const comingSoon = product ? isComingSoonProduct(product) : false
  const canPreorder = product ? acceptsPreorder(product) : false

  const whatsappMsg = product
    ? `Hi! I want to order ${form.quantity} ${unitLabel} of ${product.name} from Organic Food House.\nName: ${form.customer_name || '(pending)'}\nPhone: ${form.phone || '(pending)'}\nAddress: ${form.address_line || '(pending)'}, ${form.city || ''}`
    : ''

  async function handleOrderSubmit(e: FormEvent) {
    e.preventDefault()
    if (!product || !product.in_stock) return

    setSubmitting(true)
    setFormError(null)

    try {
      await placeOrder(product, form)
      setOrderSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Order failed')
    } finally {
      setSubmitting(false)
    }
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
          `Order fresh organic ${product.name} from ${SITE.name}. Pre-order with ${SITE.preOrderDiscount} off — delivered across ${SITE.deliveryArea}.`
        }
        path={`/product/${product.id}`}
      />

      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />

        {orderSuccess ? (
          <div className="order-success">
            <span className="success-icon" aria-hidden="true">
              ✓
            </span>
            <h1>Order placed successfully!</h1>
            <p>
              Thank you, {form.customer_name}. We received your pre-order for{' '}
              <strong>{product.name}</strong> and will contact you on{' '}
              <strong>{form.phone}</strong> to confirm delivery.
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
                  `Hi, I placed a website order for ${product.name}. My phone is ${form.phone}.`,
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
              <span
                className={`product-detail-badge ${comingSoon ? 'product-detail-badge--soon' : ''}`}
              >
                {comingSoon
                  ? 'Coming soon · Pre-order open'
                  : 'Pre-order · 10% OFF'}
              </span>
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
                <ProductPrice product={product} size="large" />
                {priceIsRange && (
                  <p className="price-range-note">{getPriceRangeNote()}</p>
                )}
                {!product.in_stock && (
                  <span className="out-stock-label">Currently unavailable</span>
                )}
              </div>

              <div className="product-quick-actions">
                <a
                  href={whatsappLink(whatsappMsg)}
                  className="btn btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Order on WhatsApp
                </a>
                <a href={`tel:${SITE.phoneTel}`} className="btn btn-outline">
                  Call {SITE.phone}
                </a>
              </div>

              <section className="order-form-section" id="order-form">
                <h2>
                  {comingSoon && canPreorder
                    ? 'Pre-order on website'
                    : 'Order on website'}
                </h2>
                <p className="order-form-intro">
                  {comingSoon && canPreorder
                    ? 'Reserve your order now — we will confirm delivery after the countdown. All fields marked * are required.'
                    : 'Fill in your details below. All fields marked * are required.'}
                </p>

                <form onSubmit={handleOrderSubmit} className="order-form">
                  <div className="form-row">
                    <label>
                      Full name *
                      <input
                        value={form.customer_name}
                        onChange={(e) =>
                          setForm({ ...form, customer_name: e.target.value })
                        }
                        required
                        autoComplete="name"
                      />
                    </label>
                    <label>
                      Phone number *
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="03XX-XXXXXXX"
                        required
                        autoComplete="tel"
                      />
                    </label>
                  </div>

                  <label>
                    Email (optional)
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      autoComplete="email"
                    />
                  </label>

                  <label>
                    Delivery address *
                    <textarea
                      value={form.address_line}
                      onChange={(e) =>
                        setForm({ ...form, address_line: e.target.value })
                      }
                      rows={2}
                      placeholder="House #, street, area"
                      required
                    />
                  </label>

                  <div className="form-row">
                    <label>
                      City *
                      <input
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        placeholder="Lahore, Karachi, etc."
                        required
                      />
                    </label>
                    <label>
                      Quantity ({unitLabel}) *
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={form.quantity}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            quantity: parseFloat(e.target.value) || 1,
                          })
                        }
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Order notes (optional)
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      rows={2}
                      placeholder="Preferred delivery date, gift message, etc."
                    />
                  </label>

                  <div className="order-summary">
                    <span>
                      {priceIsRange ? 'Estimated total (from)' : 'Estimated total'}
                    </span>
                    <strong>{formatPricePKR(lineTotal)}</strong>
                  </div>
                  {priceIsRange && (
                    <p className="order-summary-note">{getPriceRangeNote()}</p>
                  )}

                  {formError && (
                    <p className="form-error" role="alert">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-submit-order"
                    disabled={submitting || !product.in_stock}
                  >
                    {submitting
                      ? 'Placing order…'
                      : comingSoon && canPreorder
                        ? priceIsRange
                          ? `Pre-order — from ${formatPricePKR(lineTotal)}`
                          : `Pre-order — ${formatPricePKR(lineTotal)}`
                        : priceIsRange
                          ? `Place order — from ${formatPricePKR(lineTotal)}`
                          : `Place order — ${formatPricePKR(lineTotal)}`}
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}

        {!orderSuccess && recommendations}
      </div>
    </div>
  )
}
