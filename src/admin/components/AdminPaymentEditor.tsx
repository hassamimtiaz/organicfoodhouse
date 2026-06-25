import { useEffect, useState } from 'react'
import { updateOrderPaymentDetails } from '../../services/ordersApi'
import { parseAdvancePayment } from '../../lib/orderNormalize'
import {
  getOrderAmountReceived,
  getOrderDiscount,
  getOrderProductTotal,
} from '../../lib/orderPayment'
import { formatPricePKR } from '../../config/site'
import type { Order } from '../../types'
import './AdminPaymentEditor.css'

export default function AdminPaymentEditor({
  order,
  onSaved,
  compact = false,
}: {
  order: Order
  onSaved: () => void
  compact?: boolean
}) {
  const received = getOrderAmountReceived(order)
  const [deliveryValue, setDeliveryValue] = useState(
    order.delivery_charge != null ? String(order.delivery_charge) : '',
  )
  const [discountValue, setDiscountValue] = useState(
    order.discount != null ? String(order.discount) : '',
  )
  const [amountValue, setAmountValue] = useState(
    received != null ? String(received) : '',
  )
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const current = getOrderAmountReceived(order)
    setDeliveryValue(
      order.delivery_charge != null ? String(order.delivery_charge) : '',
    )
    setDiscountValue(order.discount != null ? String(order.discount) : '')
    setAmountValue(current != null ? String(current) : '')
    setAdminNotes(order.admin_notes ?? '')
  }, [
    order.id,
    order.amount_received,
    order.advance_payment,
    order.admin_notes,
    order.delivery_charge,
    order.discount,
  ])

  const productTotal = getOrderProductTotal(order)
  const deliveryPreview = deliveryValue.trim() === '' ? 0 : Number(deliveryValue) || 0
  const discountPreview = discountValue.trim() === '' ? 0 : Number(discountValue) || 0
  const grandTotalPreview = Math.max(0, productTotal + deliveryPreview - discountPreview)
  const balance =
    amountValue.trim() === ''
      ? null
      : Math.max(0, grandTotalPreview - (Number(amountValue) || 0))

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const delivery =
        deliveryValue.trim() === '' ? null : parseAdvancePayment(deliveryValue)
      const discount =
        discountValue.trim() === '' ? null : parseAdvancePayment(discountValue)
      const amount =
        amountValue.trim() === '' ? null : parseAdvancePayment(amountValue)
      if (deliveryValue.trim() !== '' && delivery == null) {
        setError('Enter a valid delivery charge in PKR.')
        return
      }
      if (discountValue.trim() !== '' && discount == null) {
        setError('Enter a valid discount in PKR.')
        return
      }
      if (amountValue.trim() !== '' && amount == null) {
        setError('Enter a valid amount received in PKR.')
        return
      }
      const maxDiscount = productTotal + (delivery ?? 0)
      if (discount != null && discount > maxDiscount) {
        setError(
          `Discount cannot exceed ${formatPricePKR(maxDiscount)} (products + delivery).`,
        )
        return
      }
      await updateOrderPaymentDetails(order.id, {
        delivery_charge: delivery,
        discount,
        amount_received: amount,
        admin_notes: adminNotes.trim() || null,
      })
      onSaved()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not save accounting details',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`admin-payment-editor${compact ? ' admin-payment-editor--compact' : ''}`}>
      {!compact && (
        <p className="admin-payment-editor-hint">
          Record delivery, discounts, and payments. Discount reduces the amount due
          so it is not counted as outstanding balance.
        </p>
      )}

      <div className="admin-payment-editor-grid">
        <label className="admin-payment-label">
          Product total
          <output className="admin-payment-readonly">
            {formatPricePKR(productTotal)}
          </output>
        </label>

        <label className="admin-payment-label">
          Delivery charge (PKR)
          <input
            type="number"
            min="0"
            step="1"
            value={deliveryValue}
            onChange={(e) => setDeliveryValue(e.target.value)}
            placeholder="e.g. 500"
            disabled={saving}
          />
        </label>

        <label className="admin-payment-label">
          Discount (PKR)
          <input
            type="number"
            min="0"
            step="1"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder="e.g. 500 friend discount"
            disabled={saving}
          />
        </label>

        <label className="admin-payment-label">
          Amount due
          <output className="admin-payment-readonly admin-payment-readonly--strong">
            {formatPricePKR(grandTotalPreview)}
          </output>
        </label>

        <label className="admin-payment-label">
          Amount received (PKR)
          <input
            type="number"
            min="0"
            step="1"
            value={amountValue}
            onChange={(e) => setAmountValue(e.target.value)}
            placeholder="e.g. 5000"
            disabled={saving}
          />
        </label>

        {getOrderDiscount(order) > 0 && (
          <label className="admin-payment-label">
            Saved discount
            <output className="admin-payment-readonly admin-payment-readonly--discount">
              −{formatPricePKR(getOrderDiscount(order))}
            </output>
          </label>
        )}
      </div>

      <label className="admin-payment-label admin-payment-label--full">
        Admin / accounting notes
        <textarea
          rows={compact ? 2 : 3}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="e.g. 10% friend discount on WhatsApp"
          disabled={saving}
        />
      </label>

      {balance != null && (
        <p className="admin-payment-balance">
          <strong>Balance due:</strong> {formatPricePKR(balance)}
        </p>
      )}

      {error && (
        <p className="admin-payment-error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-payment-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
