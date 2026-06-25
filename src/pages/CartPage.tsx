import { Link, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { MIN_PACKS_PER_ITEM } from '../lib/cartStorage'
import { getCartLineKey } from '../lib/cartLineKey'
import {
  formatCartLineUnitPrice,
  getCartLineTotal,
} from '../lib/cartTotals'
import { clearDirectCheckout } from '../lib/checkoutStorage'
import { formatPricePerBox } from '../lib/orderDisplay'
import { getOrderUnitLabel } from '../config/pricing'
import { getProductPrimaryImage } from '../config/productImages'
import { formatPricePKR, SITE } from '../config/site'
import { getProductUrl } from '../lib/productSlug'
import { isComingSoonProduct } from '../config/preorder'
import { getPriceRangeNote } from '../config/pricing'
import { useCart } from '../contexts/CartContext'
import './CartPage.css'

function RemoveIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const {
    items,
    subtotal,
    hasPriceRange,
    hasPreorder,
    setQuantity,
    removeItem,
  } = useCart()

  function goToCheckout() {
    clearDirectCheckout()
    navigate('/order')
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
                  const lineKey = getCartLineKey(line)
                  const emoji = line.product.name
                    .toLowerCase()
                    .includes('mango')
                    ? '🥭'
                    : '🍎'
                  const comingSoon = isComingSoonProduct(line.product)
                  const coverImage = getProductPrimaryImage(line.product)
                  const unitPrice = formatCartLineUnitPrice(line)
                  const lineTotal = getCartLineTotal(line)
                  const packLabel = getOrderUnitLabel(
                    line.product,
                    line.packaging_id,
                  )

                  return (
                    <li key={lineKey} className="cart-item">
                      <Link
                        to={getProductUrl(line.product)}
                        className="cart-item-visual"
                        aria-hidden="true"
                        tabIndex={-1}
                      >
                        {coverImage ? (
                          <img src={coverImage} alt="" />
                        ) : (
                          <span>{emoji}</span>
                        )}
                      </Link>

                      <div className="cart-item-main">
                        <div className="cart-item-header">
                          <div className="cart-item-info">
                            <div className="cart-item-top">
                              <Link
                                to={getProductUrl(line.product)}
                                className="cart-item-name"
                              >
                                {line.product.name}
                              </Link>
                              {comingSoon && (
                                <span className="cart-item-badge">
                                  Pre-order
                                </span>
                              )}
                            </div>
                            <p className="cart-item-meta">
                              <span className="cart-item-meta-size">
                                {packLabel}
                              </span>
                              <span className="cart-item-meta-sep" aria-hidden="true">
                                ·
                              </span>
                              <span className="cart-item-meta-price">
                                {formatPricePKR(unitPrice)} {formatPricePerBox()}
                              </span>
                            </p>
                          </div>

                          <button
                            type="button"
                            className="cart-item-dismiss"
                            onClick={() => removeItem(lineKey)}
                            aria-label={`Remove ${line.product.name} from cart`}
                          >
                            <RemoveIcon />
                          </button>
                        </div>

                        <div className="cart-item-footer">
                          <div
                            className="cart-qty-stepper"
                            role="group"
                            aria-label={`Quantity for ${line.product.name}`}
                          >
                            <button
                              type="button"
                              className="cart-qty-btn"
                              disabled={line.quantity <= 1}
                              onClick={() =>
                                setQuantity(lineKey, line.quantity - 1)
                              }
                              aria-label="Decrease boxes"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              className="cart-qty-input"
                              min={MIN_PACKS_PER_ITEM}
                              step={1}
                              inputMode="numeric"
                              value={line.quantity}
                              onChange={(e) => {
                                const next = Number(e.target.value)
                                if (next >= MIN_PACKS_PER_ITEM) {
                                  setQuantity(lineKey, next)
                                }
                              }}
                              onBlur={(e) => {
                                setQuantity(lineKey, Number(e.target.value))
                              }}
                              aria-label={`Boxes for ${line.product.name}`}
                            />
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() =>
                                setQuantity(lineKey, line.quantity + 1)
                              }
                              aria-label="Increase boxes"
                            >
                              +
                            </button>
                          </div>

                          <div className="cart-item-price">
                            <span className="cart-item-price-total">
                              {formatPricePKR(lineTotal)}
                            </span>
                          </div>
                        </div>
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
                onClick={goToCheckout}
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
    </div>
  )
}
