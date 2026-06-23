import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { isComingSoonProduct } from '../config/preorder'
import { getPriceRangeNote } from '../config/pricing'
import { getOrderUnitLabel } from '../config/pricing'
import { formatPricePKR, SITE } from '../config/site'
import { useCart } from '../contexts/CartContext'
import { MAX_PACKS_PER_ITEM } from '../lib/cartStorage'
import { formatPerBoxPhrase } from '../lib/orderDisplay'
import { getCartLineKey } from '../lib/cartLineKey'
import {
  cartHasPreorder,
  cartHasPriceRange,
  getCartLineTotal,
  getCartSubtotal,
} from '../lib/cartTotals'
import {
  clearDirectCheckout,
  loadDirectCheckout,
  updateDirectCheckout,
} from '../lib/checkoutStorage'
import { getProductUrl } from '../lib/productSlug'
import { saveOrderSuccessPayload } from '../lib/orderSuccessStorage'
import { supabaseErrorMessage } from '../lib/supabaseErrors'
import {
  fetchProductBySlugOrId,
  getProductCategoryPath,
  placeCartOrder,
} from '../services/ordersApi'
import type { CartLine, CheckoutFormData } from '../types'
import './OrderPage.css'

const emptyCheckoutForm: CheckoutFormData = {
  customer_name: '',
  phone: '',
  email: '',
  address_line: '',
  city: '',
  notes: '',
}

export default function OrderPage() {
  const navigate = useNavigate()
  const { items: cartItems, setQuantity, clearCart } = useCart()
  const [loading, setLoading] = useState(true)
  const [fromCart, setFromCart] = useState(false)
  const [checkoutLines, setCheckoutLines] = useState<CartLine[]>([])
  const [form, setForm] = useState<CheckoutFormData>(emptyCheckoutForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCheckout() {
      const direct = loadDirectCheckout()

      if (direct?.length) {
        const loaded: CartLine[] = []
        for (const snap of direct) {
          const product = await fetchProductBySlugOrId(snap.productId)
          if (product?.in_stock) {
            loaded.push({
              product,
              packaging_id: snap.packagingId ?? null,
              quantity: snap.quantity,
            })
          }
        }
        setFromCart(false)
        setCheckoutLines(loaded)
        setLoading(false)
        return
      }

      if (cartItems.length > 0) {
        setFromCart(true)
        setCheckoutLines(cartItems)
        setLoading(false)
        return
      }

      setLoading(false)
    }

    void loadCheckout()
    // Snapshot cart once on entry — do not react to clearCart after submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subtotal = useMemo(() => getCartSubtotal(checkoutLines), [checkoutLines])
  const hasPreorder = useMemo(() => cartHasPreorder(checkoutLines), [checkoutLines])
  const hasPriceRange = useMemo(() => cartHasPriceRange(checkoutLines), [checkoutLines])

  function handleQuantityChange(lineKey: string, quantity: number) {
    setCheckoutLines((prev) => {
      const next = prev.map((line) =>
        getCartLineKey(line) === lineKey ? { ...line, quantity } : line,
      )
      if (!fromCart) {
        updateDirectCheckout(
          next.map((line) => ({
            productId: line.product.id,
            packagingId: line.packaging_id ?? null,
            quantity: line.quantity,
          })),
        )
      }
      return next
    })

    if (fromCart) {
      setQuantity(lineKey, quantity)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (checkoutLines.length === 0) return

    setSubmitting(true)
    setFormError(null)

    try {
      await placeCartOrder(checkoutLines, form)

      const categoryPath =
        checkoutLines.length > 0
          ? await getProductCategoryPath(checkoutLines[0].product)
          : null

      saveOrderSuccessPayload({
        customerName: form.customer_name,
        phone: form.phone,
        isPreorder: hasPreorder,
        productIds: checkoutLines.map((line) => line.product.id),
        productNames: checkoutLines.map((line) => line.product.name),
        categoryPath,
      })

      if (fromCart) clearCart()
      clearDirectCheckout()

      navigate('/order/success', { replace: true })
    } catch (err) {
      setFormError(supabaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="order-page">
        <div className="container">
          <p className="status-msg">Loading checkout…</p>
        </div>
      </div>
    )
  }

  if (checkoutLines.length === 0 && !submitting) {
    return <Navigate to="/cart" replace />
  }

  const title = hasPreorder ? 'Complete pre-order' : 'Complete your order'
  const intro = hasPreorder
    ? 'Reserve your items now — we will contact you to confirm delivery.'
    : 'Fill in your details and we will contact you to confirm delivery.'

  return (
    <div className="order-page">
      <Seo
        title={hasPreorder ? 'Pre-order checkout' : 'Checkout'}
        description={`Complete your order on ${SITE.name}.`}
        path="/order"
      />

      <div className="container">
        <header className="order-page-header">
          <h1>{title}</h1>
          <p>{intro}</p>
        </header>

        <div className="order-layout">
          <section className="order-summary-panel" aria-label="Order summary">
            <h2>Your order</h2>
            <ul className="order-lines-list">
              {checkoutLines.map((line) => {
                const lineKey = getCartLineKey(line)
                const comingSoon = isComingSoonProduct(line.product)
                return (
                  <li key={lineKey} className="order-line">
                    <div className="order-line-info">
                      <Link
                        to={getProductUrl(line.product)}
                        className="order-line-name"
                      >
                        {line.product.name}
                      </Link>
                      {comingSoon && (
                        <span className="order-line-badge">Pre-order</span>
                      )}
                      <p className="order-line-unit">
                        {getOrderUnitLabel(line.product, line.packaging_id)}{' '}
                        {formatPerBoxPhrase()}
                      </p>
                      <label className="order-line-qty">
                        Boxes
                        <select
                          value={line.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              lineKey,
                              Number(e.target.value),
                            )
                          }
                        >
                          {Array.from(
                            { length: MAX_PACKS_PER_ITEM },
                            (_, i) => i + 1,
                          ).map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <span className="order-line-price">
                      {formatPricePKR(getCartLineTotal(line))}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="order-summary-total">
              <span>{hasPriceRange ? 'Estimated total (from)' : 'Total'}</span>
              <strong>{formatPricePKR(subtotal)}</strong>
            </div>
            {hasPriceRange && (
              <p className="order-summary-note">{getPriceRangeNote()}</p>
            )}

            {fromCart ? (
              <Link to="/cart" className="btn btn-outline btn-sm order-edit-link">
                Edit cart
              </Link>
            ) : (
              <Link
                to={getProductUrl(checkoutLines[0].product)}
                className="btn btn-outline btn-sm order-edit-link"
              >
                Back to product
              </Link>
            )}
          </section>

          <section className="order-form-panel" aria-label="Delivery details">
            <h2>Delivery details</h2>
            <form onSubmit={handleSubmit} className="order-form">
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

              <label>
                City *
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Lahore, Karachi, etc."
                  required
                />
              </label>

              <label>
                Order notes (optional)
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder={
                    hasPreorder
                      ? 'Preferred delivery window, gift message, etc.'
                      : 'Delivery preferences, gift message, etc.'
                  }
                />
              </label>

              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-submit-order"
                disabled={submitting}
              >
                {submitting
                  ? 'Placing order…'
                  : hasPreorder
                    ? hasPriceRange
                      ? `Confirm pre-order — from ${formatPricePKR(subtotal)}`
                      : `Confirm pre-order — ${formatPricePKR(subtotal)}`
                    : hasPriceRange
                      ? `Place order — from ${formatPricePKR(subtotal)}`
                      : `Place order — ${formatPricePKR(subtotal)}`}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
