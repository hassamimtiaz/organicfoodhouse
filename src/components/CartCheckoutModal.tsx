import { useEffect, useState, type FormEvent } from 'react'
import { getPriceRangeNote } from '../config/pricing'
import { formatUnitLabel } from '../config/units'
import { formatPricePKR } from '../config/site'
import { getCartLineTotal } from '../lib/cartTotals'
import { supabaseErrorMessage } from '../lib/supabaseErrors'
import { placeCartOrder } from '../services/ordersApi'
import type { CartLine, CheckoutFormData } from '../types'
import './ProductOrderModal.css'
import './CartCheckoutModal.css'

export const emptyCheckoutForm: CheckoutFormData = {
  customer_name: '',
  phone: '',
  email: '',
  address_line: '',
  city: '',
  notes: '',
}

interface CartCheckoutModalProps {
  open: boolean
  onClose: () => void
  lines: CartLine[]
  hasPreorder: boolean
  hasPriceRange: boolean
  subtotal: number
  onSuccess: (form: CheckoutFormData) => void
}

export default function CartCheckoutModal({
  open,
  onClose,
  lines,
  hasPreorder,
  hasPriceRange,
  subtotal,
  onSuccess,
}: CartCheckoutModalProps) {
  const [form, setForm] = useState<CheckoutFormData>(emptyCheckoutForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(emptyCheckoutForm)
    setFormError(null)
    setSubmitting(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (lines.length === 0) return

    setSubmitting(true)
    setFormError(null)

    try {
      await placeCartOrder(
        lines.map((line) => ({
          product: line.product,
          quantity: line.quantity,
        })),
        form,
      )
      onSuccess(form)
      onClose()
    } catch (err) {
      setFormError(supabaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const title = hasPreorder ? 'Complete pre-order' : 'Complete your order'
  const intro = hasPreorder
    ? 'We will confirm delivery for all items after we contact you.'
    : 'Fill in your details and we will contact you to confirm delivery.'

  return (
    <div
      className="order-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="order-modal cart-checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-checkout-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="order-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="cart-checkout-title">{title}</h2>
        <p className="order-modal-intro">
          {intro} All fields marked * are required.
        </p>

        <div className="cart-checkout-lines">
          {lines.map((line) => (
            <div key={line.product.id} className="cart-checkout-line">
              <div>
                <strong>{line.product.name}</strong>
                <span className="cart-checkout-line-meta">
                  {line.quantity} {line.quantity === 1 ? 'pack' : 'packs'} ·{' '}
                  {formatUnitLabel(line.product, { titleCaseMeasure: true })}
                </span>
              </div>
              <span>{formatPricePKR(getCartLineTotal(line))}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="order-form order-form--modal">
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
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Lahore, Karachi, etc."
                required
              />
            </label>
          </div>

          <label>
            Order notes (optional)
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Delivery preferences, gift message, etc."
            />
          </label>

          <div className="order-summary">
            <span>
              {hasPriceRange ? 'Estimated total (from)' : 'Estimated total'}
            </span>
            <strong>{formatPricePKR(subtotal)}</strong>
          </div>
          {hasPriceRange && (
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
            disabled={submitting || lines.length === 0}
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
      </div>
    </div>
  )
}
