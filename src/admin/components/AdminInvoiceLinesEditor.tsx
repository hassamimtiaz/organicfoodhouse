import { formatPricePKR } from '../../config/site'
import {
  INVOICE_LINE_PRESETS,
  getExtraChargesTotal,
  sanitizeExtraChargesInput,
} from '../../lib/orderExtraCharges'
import type { OrderExtraCharge, OrderExtraChargeKind } from '../../types'
import './AdminInvoiceLinesEditor.css'

export type InvoiceLineDraft = {
  key: string
  label: string
  amount: string
  kind: OrderExtraChargeKind
}

function newKey() {
  return `line-${crypto.randomUUID()}`
}

export function draftsFromCharges(charges: OrderExtraCharge[]): InvoiceLineDraft[] {
  return charges.map((charge) => ({
    key: newKey(),
    label: charge.label,
    amount: String(charge.amount),
    kind: charge.kind,
  }))
}

export function emptyInvoiceLineDraft(
  preset?: { label: string; kind: OrderExtraChargeKind },
): InvoiceLineDraft {
  return {
    key: newKey(),
    label: preset?.label ?? '',
    amount: '',
    kind: preset?.kind ?? 'charge',
  }
}

interface Props {
  lines: InvoiceLineDraft[]
  onChange: (lines: InvoiceLineDraft[]) => void
  productTotal?: number
  disabled?: boolean
}

export default function AdminInvoiceLinesEditor({
  lines,
  onChange,
  productTotal = 0,
  disabled = false,
}: Props) {
  const sanitized = sanitizeExtraChargesInput(lines)
  const adjustments = getExtraChargesTotal(sanitized)
  const amountDue = Math.max(0, productTotal + adjustments)

  function updateLine(key: string, patch: Partial<InvoiceLineDraft>) {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function removeLine(key: string) {
    onChange(lines.filter((line) => line.key !== key))
  }

  function addBlank() {
    onChange([...lines, emptyInvoiceLineDraft()])
  }

  function addPreset(label: string, kind: OrderExtraChargeKind) {
    onChange([...lines, emptyInvoiceLineDraft({ label, kind })])
  }

  return (
    <div className="admin-invoice-lines">
      <div className="admin-invoice-lines-header">
        <div>
          <h4>Invoice lines</h4>
          <p>
            Add charges or discounts that appear on the invoice (delivery, gift
            card printing, friend discount, etc.).
          </p>
        </div>
      </div>

      <div className="admin-invoice-line-presets" role="group" aria-label="Quick add">
        {INVOICE_LINE_PRESETS.map((preset) => (
          <button
            key={`${preset.kind}-${preset.label}`}
            type="button"
            className="btn btn-outline btn-sm"
            disabled={disabled}
            onClick={() => addPreset(preset.label, preset.kind)}
          >
            + {preset.label}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={disabled}
          onClick={addBlank}
        >
          + Custom line
        </button>
      </div>

      {lines.length === 0 ? (
        <p className="admin-invoice-lines-empty">
          No extra invoice lines yet. Product total only.
        </p>
      ) : (
        <ul className="admin-invoice-lines-list">
          {lines.map((line) => (
            <li key={line.key} className="admin-invoice-line-row">
              <div className="admin-invoice-line-row-top">
                <label className="admin-invoice-line-field">
                  <span>Type</span>
                  <select
                    value={line.kind}
                    disabled={disabled}
                    onChange={(e) =>
                      updateLine(line.key, {
                        kind: e.target.value as OrderExtraChargeKind,
                      })
                    }
                  >
                    <option value="charge">Charge (+)</option>
                    <option value="discount">Discount (−)</option>
                  </select>
                </label>
                <label className="admin-invoice-line-field">
                  <span>Amount (PKR)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={line.amount}
                    disabled={disabled}
                    placeholder="0"
                    onChange={(e) =>
                      updateLine(line.key, { amount: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="admin-invoice-line-field">
                <span>Label</span>
                <input
                  value={line.label}
                  disabled={disabled}
                  placeholder="e.g. Gift Card Printing"
                  onChange={(e) =>
                    updateLine(line.key, { label: e.target.value })
                  }
                />
              </label>
              <div className="admin-invoice-line-actions">
                <button
                  type="button"
                  className="admin-invoice-line-remove"
                  disabled={disabled}
                  onClick={() => removeLine(line.key)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="admin-invoice-lines-summary">
        <div>
          <span>Product total</span>
          <strong>{formatPricePKR(productTotal)}</strong>
        </div>
        <div>
          <span>Adjustments</span>
          <strong>
            {adjustments === 0
              ? formatPricePKR(0)
              : `${adjustments > 0 ? '+' : '−'}${formatPricePKR(Math.abs(adjustments))}`}
          </strong>
        </div>
        <div className="admin-invoice-lines-summary-due">
          <span>Amount due</span>
          <strong>{formatPricePKR(amountDue)}</strong>
        </div>
      </div>
    </div>
  )
}
