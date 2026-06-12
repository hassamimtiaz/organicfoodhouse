import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CartCheckoutModal from '../components/CartCheckoutModal'
import Seo from '../components/Seo'
import { MAX_PACKS_PER_ITEM } from '../lib/cartStorage'
import { getCartLineTotal } from '../lib/cartTotals'
import { formatUnitLabel } from '../config/units'
import { formatPricePKR, SITE } from '../config/site'
import { getProductUrl } from '../lib/productSlug'
import { isComingSoonProduct } from '../config/preorder'
import { getPriceRangeNote } from '../config/pricing'
import { saveOrderSuccessPayload } from '../lib/orderSuccessStorage'
import { getProductCategoryPath } from '../services/ordersApi'
import { useCart } from '../contexts/CartContext'
import type { CheckoutFormData } from '../types'
import './CartPage.css'

export default function CartPage() {
  const navigate = useNavigate()
  const {
    items,
    subtotal,
    hasPriceRange,
    hasPreorder,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  async function handleCheckoutSuccess(form: CheckoutFormData) {
    const productIds = items.map((line) => line.product.id)
    const productNames = items.map((line) => line.product.name)
    const categoryPath =
      items.length > 0
        ? await getProductCategoryPath(items[0].product)
        : null

    clearCart()
    saveOrderSuccessPayload({
      customerName: form.customer_name,
      phone: form.phone,
      isPreorder: hasPreorder,
      productIds,
      productNames,
      categoryPath,
    })
    navigate('/order/success', { replace: true })
  }

  return (
    <div className="cart-page">
      <Seo
        title="Your cart"
        description={`Review items in your cart and checkout on ${SITE.name}.`}
        path="/cart"
      />

      <div className="container">
        <header className="cart-page-header">
          <h1>Your cart</h1>
          <p>Add multiple products and checkout together in one order.</p>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <Link to="/" className="btn btn-primary">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items" aria-label="Cart items">
              <ul className="cart-items-list">
                {items.map((line) => {
                  const emoji = line.product.name
                    .toLowerCase()
                    .includes('mango')
                    ? '🥭'
                    : '🍎'
                  const comingSoon = isComingSoonProduct(line.product)

                  return (
                    <li key={line.product.id} className="cart-item">
                      <Link
                        to={getProductUrl(line.product)}
                        className="cart-item-visual"
                        aria-hidden="true"
                        tabIndex={-1}
                      >
                        {line.product.image_url ? (
                          <img src={line.product.image_url} alt="" />
                        ) : (
                          <span>{emoji}</span>
                        )}
                      </Link>

                      <div className="cart-item-body">
                        <div className="cart-item-top">
                          <Link
                            to={getProductUrl(line.product)}
                            className="cart-item-name"
                          >
                            {line.product.name}
                          </Link>
                          {comingSoon && (
                            <span className="cart-item-badge">Pre-order</span>
                          )}
                        </div>
                        <p className="cart-item-unit">
                          {formatUnitLabel(line.product, {
                            titleCaseMeasure: true,
                          })}{' '}
                          per pack
                        </p>

                        <div className="cart-item-controls">
                          <label className="cart-item-qty">
                            Packs
                            <select
                              value={line.quantity}
                              onChange={(e) =>
                                setQuantity(
                                  line.product.id,
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
                          <button
                            type="button"
                            className="cart-item-remove"
                            onClick={() => removeItem(line.product.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-price">
                        {formatPricePKR(getCartLineTotal(line))}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <aside className="cart-summary">
              <h2>Order summary</h2>
              <div className="cart-summary-row">
                <span>Items</span>
                <span>{items.length}</span>
              </div>
              <div className="cart-summary-row cart-summary-total">
                <span>{hasPriceRange ? 'Estimated total (from)' : 'Total'}</span>
                <strong>{formatPricePKR(subtotal)}</strong>
              </div>
              {hasPriceRange && (
                <p className="cart-summary-note">{getPriceRangeNote()}</p>
              )}
              <button
                type="button"
                className="btn btn-primary cart-checkout-btn"
                onClick={() => setCheckoutOpen(true)}
              >
                {hasPreorder ? 'Proceed to pre-order' : 'Proceed to checkout'}
              </button>
              <Link to="/" className="btn btn-outline cart-continue-link">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>

      <CartCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        lines={items}
        hasPreorder={hasPreorder}
        hasPriceRange={hasPriceRange}
        subtotal={subtotal}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  )
}
