import { useEffect, useState, type FormEvent } from 'react'
import {
  createPromoCode,
  deletePromoCode,
  fetchAllPromoCodes,
  setPromoCodeActive,
  updatePromoCode,
} from '../../services/promoApi'
import { formatPricePKR } from '../../config/site'
import { formatPromoDiscountLabel } from '../../lib/promoCode'
import type { PromoCode, PromoCodeFormData } from '../../types'

interface Props {
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

const emptyForm: PromoCodeFormData = {
  code: '',
  discount_type: 'percent',
  discount_value: 10,
  is_active: true,
  min_order_amount: null,
  max_uses: null,
  expires_at: '',
  description: '',
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AdminPromoCodes({ onMessage }: Props) {
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<PromoCodeFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function loadPromos() {
    setLoading(true)
    try {
      setPromos(await fetchAllPromoCodes())
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load promo codes',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPromos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await updatePromoCode(editingId, form)
        onMessage({ type: 'success', text: 'Promo code updated.' })
      } else {
        await createPromoCode(form)
        onMessage({ type: 'success', text: 'Promo code created.' })
      }
      setForm(emptyForm)
      setEditingId(null)
      await loadPromos()
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(promo: PromoCode) {
    const next = !promo.is_active
    setTogglingId(promo.id)
    try {
      await setPromoCodeActive(promo.id, next)
      onMessage({
        type: 'success',
        text: next ? 'Promo code activated.' : 'Promo code deactivated.',
      })
      await loadPromos()
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Update failed',
      })
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(promo: PromoCode) {
    if (!confirm(`Delete promo code "${promo.code}"?`)) return
    try {
      await deletePromoCode(promo.id)
      onMessage({ type: 'success', text: 'Promo code deleted.' })
      if (editingId === promo.id) {
        setEditingId(null)
        setForm(emptyForm)
      }
      await loadPromos()
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Delete failed',
      })
    }
  }

  function startEdit(promo: PromoCode) {
    setEditingId(promo.id)
    setForm({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      is_active: promo.is_active,
      min_order_amount: promo.min_order_amount,
      max_uses: promo.max_uses,
      expires_at: toDatetimeLocalValue(promo.expires_at),
      description: promo.description ?? '',
    })
  }

  return (
    <div className="portal-grid">
      <section className="portal-panel">
        <h2>{editingId ? 'Edit promo code' : 'Add promo code'}</h2>
        <form onSubmit={handleSubmit} className="admin-form">
          <label>
            Code *
            <input
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g. WELCOME10"
              required
            />
          </label>

          <div className="form-row">
            <label>
              Discount type *
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_type: e.target.value as PromoCodeFormData['discount_type'],
                  })
                }
              >
                <option value="percent">Percentage (%)</option>
                <option value="amount">Fixed amount (PKR)</option>
              </select>
            </label>
            <label>
              {form.discount_type === 'percent' ? 'Percent off *' : 'Amount off (PKR) *'}
              <input
                type="number"
                min={form.discount_type === 'percent' ? 1 : 1}
                max={form.discount_type === 'percent' ? 100 : undefined}
                step={form.discount_type === 'percent' ? 1 : 50}
                value={form.discount_value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_value: Number(e.target.value) || 0,
                  })
                }
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Min. order (PKR)
              <input
                type="number"
                min={0}
                step={100}
                value={form.min_order_amount ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    min_order_amount:
                      e.target.value.trim() === ''
                        ? null
                        : Number(e.target.value),
                  })
                }
                placeholder="Optional"
              />
            </label>
            <label>
              Max uses
              <input
                type="number"
                min={1}
                step={1}
                value={form.max_uses ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_uses:
                      e.target.value.trim() === ''
                        ? null
                        : Number(e.target.value),
                  })
                }
                placeholder="Unlimited"
              />
            </label>
          </div>

          <label>
            Expires at
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) =>
                setForm({ ...form, expires_at: e.target.value })
              }
            />
          </label>

          <label>
            Internal note
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="e.g. Ramadan campaign"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
            />
            Active (customers can use at checkout)
          </label>

          <div className="form-actions">
            {editingId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancel edit
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update code' : 'Add code'}
            </button>
          </div>
        </form>
      </section>

      <section className="portal-panel portal-list">
        <h2>Promo codes</h2>
        {loading ? (
          <p className="status-msg">Loading…</p>
        ) : promos.length === 0 ? (
          <p className="status-msg">No promo codes yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Uses</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => (
                  <tr key={promo.id}>
                    <td>
                      <strong>{promo.code}</strong>
                      {promo.description && (
                        <div className="admin-card-meta">
                          {promo.description}
                        </div>
                      )}
                      {promo.min_order_amount != null && (
                        <div className="admin-card-meta">
                          Min. {formatPricePKR(promo.min_order_amount)}
                        </div>
                      )}
                    </td>
                    <td>{formatPromoDiscountLabel(promo)}</td>
                    <td>
                      {promo.used_count}
                      {promo.max_uses != null ? ` / ${promo.max_uses}` : ''}
                    </td>
                    <td>
                      {promo.is_active ? (
                        <span className="admin-card-meta">Active</span>
                      ) : (
                        <span className="admin-hidden-badge">Inactive</span>
                      )}
                    </td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => startEdit(promo)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={togglingId === promo.id}
                        onClick={() => void handleToggleActive(promo)}
                      >
                        {promo.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn-link danger"
                        onClick={() => void handleDelete(promo)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
