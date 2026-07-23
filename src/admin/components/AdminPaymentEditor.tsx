import { useEffect, useState } from 'react'
import { updateOrderPaymentDetails } from '../../services/ordersApi'
import { parseAdvancePayment } from '../../lib/orderNormalize'
import {
  deriveLegacyChargesFromLines,
  invoiceLinesFromOrder,
  sanitizeExtraChargesInput,
} from '../../lib/orderExtraCharges'
import {
  getOrderAmountReceived,
  getOrderProductTotal,
} from '../../lib/orderPayment'
import { formatPricePKR } from '../../config/site'
import type { Order } from '../../types'
import AdminInvoiceLinesEditor, {
  draftsFromCharges,
  type InvoiceLineDraft,
} from './AdminInvoiceLinesEditor'
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
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineDraft[]>(() =>
    draftsFromCharges(invoiceLinesFromOrder(order)),
  )
  const [amountValue, setAmountValue] = useState(
    received != null ? String(received) : '',
  )
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const current = getOrderAmountReceived(order)
    setInvoiceLines(draftsFromCharges(invoiceLinesFromOrder(order)))
    setAmountValue(current != null ? String(current) : '')
    setAdminNotes(order.admin_notes ?? '')
  }, [
    order.id,
    order.amount_received,
    order.advance_payment,
    order.admin_notes,
    order.delivery_charge,
    order.discount,
    order.extra_charges,
    order.promo_code,
  ])

  const productTotal = getOrderProductTotal(order)
  const sanitizedLines = sanitizeExtraChargesInput(invoiceLines)
  const derived = deriveLegacyChargesFromLines(sanitizedLines)
  const amountDue = Math.max(
    0,
    productTotal +
      sanitizedLines.reduce(
        (sum, line) =>
          line.kind === 'discount' ? sum - line.amount : sum + line.amount,
        0,
      ),
  )
  const balance =
    amountValue.trim() === ''
      ? null
      : Math.max(0, amountDue - (Number(amountValue) || 0))

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      for (const line of invoiceLines) {
        if (line.label.trim() && line.amount.trim() === '') {
          setError(`Enter an amount for “${line.label.trim()}”.`)
          return
        }
        if (line.amount.trim() !== '' && !line.label.trim()) {
          setError('Each invoice line needs a label.')
          return
        }
      }

      const amount =
        amountValue.trim() === '' ? null : parseAdvancePayment(amountValue)
      if (amountValue.trim() !== '' && amount == null) {
        setError('Enter a valid amount received in PKR.')
        return
      }

      await updateOrderPaymentDetails(order.id, {
        delivery_charge: derived.delivery_charge,
        discount: derived.discount,
        amount_received: amount,
        admin_notes: adminNotes.trim() || null,
        extra_charges: derived.extra_charges,
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
          Add invoice lines for delivery, discounts, gift cards, and other
          charges. These appear on the customer invoice and update amount due.
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
          Amount due
          <output className="admin-payment-readonly admin-payment-readonly--strong">
            {formatPricePKR(amountDue)}
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
      </div>

      <AdminInvoiceLinesEditor
        lines={invoiceLines}
        onChange={setInvoiceLines}
        productTotal={productTotal}
        disabled={saving}
      />

      <label className="admin-payment-label admin-payment-label--full">
        Admin / accounting notes
        <textarea
          rows={compact ? 2 : 3}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="e.g. Friend discount agreed on WhatsApp"
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
