import { useMemo, useState, type FormEvent } from 'react'
import { getOrderLineTotal, getOrderUnitLabel, getOrderUnitPrice } from '../../config/pricing'
import { formatPackagingLabel, hasPackagings } from '../../config/packaging'
import { formatPricePKR } from '../../config/site'
import { clampPackQuantity, MIN_PACKS_PER_ITEM } from '../../lib/cartStorage'
import { parseAdvancePayment } from '../../lib/orderNormalize'
import { createManualOrder } from '../../services/ordersApi'
import type { ManualOrderFormData, Product } from '../../types'
import './AdminManualOrderForm.css'

const emptyForm = (): ManualOrderFormData => ({
  customer_name: '',
  phone: '',
  email: '',
  address_line: '',
  city: '',
  notes: '',
  order_type: 'order',
  admin_notes: '',
  amount_received: null,
  delivery_charge: null,
  discount: null,
  lines: [{ product_id: '', packaging_id: null, quantity: 1 }],
})

interface Props {
  products: Product[]
  onCreated: () => void
  onCancel: () => void
}

export default function AdminManualOrderForm({
  products,
  onCreated,
  onCancel,
}: Props) {
  const [form, setForm] = useState<ManualOrderFormData>(emptyForm)
  const [amountInput, setAmountInput] = useState('')
  const [deliveryInput, setDeliveryInput] = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  )

  const lineDetails = useMemo(() => {
    return form.lines.map((line) => {
      const product = sortedProducts.find((p) => p.id === line.product_id)
      if (!product) return null
      const qty = clampPackQuantity(line.quantity)
      return {
        product,
        quantity: qty,
        unitPrice: getOrderUnitPrice(product, line.packaging_id),
        lineTotal: getOrderLineTotal(product, qty, line.packaging_id),
        unitLabel: getOrderUnitLabel(product, line.packaging_id),
      }
    })
  }, [form.lines, sortedProducts])

  const estimatedTotal = lineDetails.reduce(
    (sum, line) => sum + (line?.lineTotal ?? 0),
    0,
  )

  function updateLine(
    index: number,
    patch: Partial<ManualOrderFormData['lines'][number]>,
  ) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, ...patch } : line,
      ),
    }))
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { product_id: '', packaging_id: null, quantity: 1 }],
    }))
  }

  function removeLine(index: number) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const validLines = form.lines.filter((line) => line.product_id)
    if (validLines.length === 0) {
      setError('Select at least one product.')
      return
    }

    const amountReceived =
      amountInput.trim() === '' ? null : parseAdvancePayment(amountInput)
    const deliveryCharge =
      deliveryInput.trim() === '' ? null : parseAdvancePayment(deliveryInput)
    const discount =
      discountInput.trim() === '' ? null : parseAdvancePayment(discountInput)

    if (amountInput.trim() !== '' && amountReceived == null) {
      setError('Enter a valid amount received in PKR.')
      return
    }
    if (deliveryInput.trim() !== '' && deliveryCharge == null) {
      setError('Enter a valid delivery charge in PKR.')
      return
    }
    if (discountInput.trim() !== '' && discount == null) {
      setError('Enter a valid discount in PKR.')
      return
    }

    setSubmitting(true)
    try {
      await createManualOrder(
        {
          ...form,
          lines: validLines,
          amount_received: amountReceived,
          delivery_charge: deliveryCharge,
          discount,
        },
        products,
      )
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="admin-manual-order">
      <header className="admin-manual-order-header">
        <div>
          <h3>Add WhatsApp order</h3>
          <p>Record an order taken on WhatsApp or phone — it appears in your orders list.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </header>

      <form className="admin-manual-order-form" onSubmit={handleSubmit}>
        <div className="admin-manual-order-grid">
          <fieldset className="admin-manual-order-fieldset">
            <legend>Customer</legend>
            <div className="form-row">
              <label>
                Full name *
                <input
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Phone *
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </label>
            </div>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Delivery address *
              <textarea
                rows={2}
                value={form.address_line}
                onChange={(e) =>
                  setForm({ ...form, address_line: e.target.value })
                }
                required
              />
            </label>
            <div className="form-row">
              <label>
                City *
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </label>
              <label>
                Order type
                <select
                  value={form.order_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      order_type: e.target.value as ManualOrderFormData['order_type'],
                    })
                  }
                >
                  <option value="order">Current order</option>
                  <option value="preorder">Pre-order</option>
                </select>
              </label>
            </div>
            <label>
              Customer note
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Delivery preferences, etc."
              />
            </label>
          </fieldset>

          <fieldset className="admin-manual-order-fieldset">
            <legend>Products</legend>
            <ul className="admin-manual-order-lines">
              {form.lines.map((line, index) => {
                const selectedProduct = sortedProducts.find(
                  (p) => p.id === line.product_id,
                )
                const packagingOptions = selectedProduct?.packagings ?? []

                return (
                <li key={index} className="admin-manual-order-line">
                  <label>
                    Product *
                    <select
                      value={line.product_id}
                      onChange={(e) => {
                        const product = sortedProducts.find(
                          (p) => p.id === e.target.value,
                        )
                        updateLine(index, {
                          product_id: e.target.value,
                          packaging_id:
                            product && hasPackagings(product)
                              ? product.packagings?.[0]?.id ?? null
                              : null,
                        })
                      }}
                      required={index === 0}
                    >
                      <option value="">Select product…</option>
                      {sortedProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedProduct && hasPackagings(selectedProduct) && (
                    <label>
                      Box *
                      <select
                        value={line.packaging_id ?? ''}
                        onChange={(e) =>
                          updateLine(index, {
                            packaging_id: e.target.value || null,
                          })
                        }
                        required
                      >
                        <option value="">Select box…</option>
                        {packagingOptions.map((packaging) => (
                          <option key={packaging.id} value={packaging.id}>
                            {formatPackagingLabel(packaging)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    Boxes
                    <input
                      type="number"
                      min={MIN_PACKS_PER_ITEM}
                      step={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(index, { quantity: Number(e.target.value) })
                      }
                      onBlur={(e) =>
                        updateLine(index, {
                          quantity: clampPackQuantity(Number(e.target.value)),
                        })
                      }
                    />
                  </label>
                  {lineDetails[index] && (
                    <span className="admin-manual-order-line-total">
                      {formatPricePKR(lineDetails[index]!.lineTotal)}
                    </span>
                  )}
                  {form.lines.length > 1 && (
                    <button
                      type="button"
                      className="admin-manual-order-remove"
                      onClick={() => removeLine(index)}
                    >
                      Remove
                    </button>
                  )}
                </li>
                )
              })}
            </ul>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={addLine}
            >
              + Add another product
            </button>
            <p className="admin-manual-order-estimated">
              Estimated total: <strong>{formatPricePKR(estimatedTotal)}</strong>
            </p>
          </fieldset>
        </div>

        <fieldset className="admin-manual-order-fieldset admin-manual-order-accounting">
          <legend>Accounting (optional)</legend>
          <div className="form-row">
            <label>
              Delivery charge (PKR)
              <input
                type="number"
                min="0"
                step="1"
                value={deliveryInput}
                onChange={(e) => setDeliveryInput(e.target.value)}
                placeholder="e.g. 500"
              />
            </label>
            <label>
              Discount (PKR)
              <input
                type="number"
                min="0"
                step="1"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="e.g. friend discount"
              />
            </label>
            <label>
              Amount received (PKR)
              <input
                type="number"
                min="0"
                step="1"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Cash / transfer received so far"
              />
            </label>
          </div>
          <label>
            Admin notes
            <textarea
              rows={2}
              value={form.admin_notes}
              onChange={(e) =>
                setForm({ ...form, admin_notes: e.target.value })
              }
              placeholder="e.g. Friend discount — charged ₨500 less than catalog price"
            />
          </label>
        </fieldset>

        {error && (
          <p className="admin-manual-order-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || estimatedTotal <= 0}
        >
          {submitting ? 'Saving order…' : 'Save WhatsApp order'}
        </button>
      </form>
    </section>
  )
}
