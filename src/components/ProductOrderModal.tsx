import { useEffect, useState, type FormEvent } from 'react'
import {
  getOrderLineTotal,
  getPriceRangeNote,
  isPriceRange,
} from '../config/pricing'
import { formatUnitLabel, hasUnitRange } from '../config/units'
import { formatPricePKR } from '../config/site'
import { supabaseErrorMessage } from '../lib/supabaseErrors'
import { placeOrder } from '../services/ordersApi'
import type { PlaceOrderFormData, Product } from '../types'
import './ProductOrderModal.css'

const QUANTITY_OPTIONS = [1, 2, 3] as const

export const emptyOrderForm: PlaceOrderFormData = {
  customer_name: '',
  phone: '',
  email: '',
  address_line: '',
  city: '',
  notes: '',
  quantity: 1,
}

interface ProductOrderModalProps {
  open: boolean
  onClose: () => void
  product: Product
  isPreorder: boolean
  onSuccess: (form: PlaceOrderFormData) => void
}

export default function ProductOrderModal({
  open,
  onClose,
  product,
  isPreorder,
  onSuccess,
}: ProductOrderModalProps) {
  const [form, setForm] = useState<PlaceOrderFormData>(emptyOrderForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(emptyOrderForm)
    setFormError(null)
    setSubmitting(false)
  }, [open, product.id])

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

  const lineTotal = getOrderLineTotal(product, form.quantity)
  const priceIsRange = isPriceRange(product)
  const packSizeLabel = formatUnitLabel(product, { titleCaseMeasure: true })
  const packSizeHint = hasUnitRange(product)
    ? `Each pack: ${packSizeLabel}`
    : `Sold by: ${packSizeLabel}`

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!product.in_stock) return

    setSubmitting(true)
    setFormError(null)

    try {
      await placeOrder(product, form, { isPreorder })
      onSuccess(form)
      onClose()
    } catch (err) {
      setFormError(supabaseErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const title = isPreorder ? 'Pre-order on website' : 'Order on website'
  const intro = isPreorder
    ? 'Reserve your order now — we will confirm delivery after the countdown.'
    : 'Fill in your details and we will contact you to confirm delivery.'

  return (
    <div
      className="order-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
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

        <h2 id="order-modal-title">{title}</h2>
        <p className="order-modal-intro">
          {intro} All fields marked * are required.
        </p>
        <p className="order-modal-product">
          <strong>{product.name}</strong>
        </p>

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
            <label>
              Number of packs *
              <select
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: Number(e.target.value) as 1 | 2 | 3,
                  })
                }
                required
              >
                {QUANTITY_OPTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q} {q === 1 ? 'pack' : 'packs'}
                  </option>
                ))}
              </select>
              <span className="order-field-hint">{packSizeHint}</span>
            </label>
          </div>

          <label>
            Order notes (optional)
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder={
                isPreorder
                  ? 'Preferred delivery window, gift message, etc.'
                  : 'Delivery preferences, gift message, etc.'
              }
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
              : isPreorder
                ? priceIsRange
                  ? `Confirm pre-order — from ${formatPricePKR(lineTotal)}`
                  : `Confirm pre-order — ${formatPricePKR(lineTotal)}`
                : priceIsRange
                  ? `Place order — from ${formatPricePKR(lineTotal)}`
                  : `Place order — ${formatPricePKR(lineTotal)}`}
          </button>
        </form>
      </div>
    </div>
  )
}
