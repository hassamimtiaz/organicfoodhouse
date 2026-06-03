import { useEffect, useState, type FormEvent } from 'react'
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from '../../services/adminApi'
import { formatSubcategoryLabel } from '../../services/api'
import { formatProductPrice, hasProductDiscount } from '../../config/pricing'
import { formatUnitLabel } from '../../config/units'
import type { Category, Product, ProductFormData, PriceType, UnitType } from '../../types'
import ProductImageField from './ProductImageField'

interface Props {
  topLevel: Category[]
  subcategories: Category[]
  products: Product[]
  loading: boolean
  onSaved: () => Promise<void>
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

const emptyProduct: ProductFormData = {
  category_id: '',
  name: '',
  description: '',
  price_type: 'single',
  price: 0,
  price_max: null,
  unit_type: 'single',
  unit: 'kg',
  unit_min: null,
  unit_max: null,
  discount_percent: null,
  image_url: '',
  in_stock: true,
  coming_soon: false,
  delivery_starts_at: '',
}

function unitTypeFromProduct(product: Product): UnitType {
  return product.unit_min != null && product.unit_max != null ? 'range' : 'single'
}

export default function AdminProducts({
  topLevel,
  subcategories,
  products,
  loading,
  onSaved,
  onMessage,
}: Props) {
  const [form, setForm] = useState<ProductFormData>(emptyProduct)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingId || subcategories.length === 0) return
    setForm((current) => {
      if (current.category_id) return current
      return { ...current, category_id: subcategories[0].id }
    })
  }, [subcategories, editingId])

  function labelFor(sub: Category) {
    return formatSubcategoryLabel(sub, topLevel)
  }

  function setUnitType(unit_type: UnitType) {
    setForm((f) => ({
      ...f,
      unit_type,
      unit_min:
        unit_type === 'range'
          ? f.unit_min != null && f.unit_max != null && f.unit_max >= f.unit_min
            ? f.unit_min
            : 1
          : null,
      unit_max:
        unit_type === 'range'
          ? f.unit_min != null && f.unit_max != null && f.unit_max >= f.unit_min
            ? f.unit_max
            : f.unit_min ?? 1
          : null,
    }))
  }

  function setPriceType(price_type: PriceType) {
    setForm((f) => ({
      ...f,
      price_type,
      price_max:
        price_type === 'range'
          ? f.price_max != null && f.price_max >= f.price
            ? f.price_max
            : f.price || 0
          : null,
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.category_id) {
      onMessage({ type: 'error', text: 'Select a subcategory.' })
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateProduct(editingId, form)
        onMessage({ type: 'success', text: 'Product updated.' })
      } else {
        await createProduct(form)
        onMessage({ type: 'success', text: 'Product added.' })
      }
      setForm({ ...emptyProduct, category_id: subcategories[0]?.id ?? '' })
      setEditingId(null)
      await onSaved()
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete product "${name}"?`)) return
    try {
      await deleteProduct(id)
      onMessage({ type: 'success', text: 'Product deleted.' })
      await onSaved()
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Delete failed',
      })
    }
  }

  return (
    <div className="portal-grid">
      <section className="portal-panel">
        <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
        <p className="panel-hint">
          Products belong to a subcategory (e.g. Dasheri under Fruits → Mangoes).
        </p>
        {subcategories.length === 0 ? (
          <p className="status-msg">
            Create a major category and subcategory before adding products.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Subcategory
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                required
              >
                <option value="">Select subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {labelFor(sub)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dasheri"
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </label>

            <fieldset className="price-type-fieldset">
              <legend>Pricing</legend>
              <div className="price-type-options" role="radiogroup" aria-label="Price type">
                <label className="price-type-option">
                  <input
                    type="radio"
                    name="price_type"
                    checked={form.price_type === 'single'}
                    onChange={() => setPriceType('single')}
                  />
                  Single price
                </label>
                <label className="price-type-option">
                  <input
                    type="radio"
                    name="price_type"
                    checked={form.price_type === 'range'}
                    onChange={() => setPriceType('range')}
                  />
                  Price range
                </label>
              </div>

              {form.price_type === 'single' ? (
                <label>
                  Price (PKR)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.price || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </label>
              ) : (
                <div className="form-row form-row-stacked price-range-inputs">
                  <label>
                    Minimum price (PKR)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.price || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Maximum price (PKR)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.price_max ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          price_max: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </label>
                </div>
              )}

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.discount_percent != null}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_percent: e.target.checked ? 10 : null,
                    })
                  }
                />
                Apply discount
              </label>

              {form.discount_percent != null && (
                <label>
                  Discount (%)
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={form.discount_percent || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_percent: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </label>
              )}

              {(form.discount_percent != null && form.discount_percent > 0) && (
                <p className="panel-hint">
                  Customer price preview:{' '}
                  <strong>
                    {formatProductPrice(form, {
                      includeUnit: form,
                      showWasPrice: true,
                    })}
                  </strong>
                </p>
              )}
            </fieldset>

            <fieldset className="price-type-fieldset">
              <legend>Unit / size</legend>
              <div className="price-type-options" role="radiogroup" aria-label="Unit type">
                <label className="price-type-option">
                  <input
                    type="radio"
                    name="unit_type"
                    checked={form.unit_type === 'single'}
                    onChange={() => setUnitType('single')}
                  />
                  Fixed unit
                </label>
                <label className="price-type-option">
                  <input
                    type="radio"
                    name="unit_type"
                    checked={form.unit_type === 'range'}
                    onChange={() => setUnitType('range')}
                  />
                  Size range
                </label>
              </div>

              <label>
                Measure
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg, dozen, box…"
                  required
                />
              </label>

              {form.unit_type === 'range' ? (
                <div className="form-row form-row-stacked price-range-inputs">
                  <label>
                    Minimum size
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.unit_min ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          unit_min: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Maximum size
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.unit_max ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          unit_max: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </label>
                </div>
              ) : (
                <p className="panel-hint">
                  Shown as e.g. <strong>/ kg</strong> next to the price.
                </p>
              )}

              {form.unit_type === 'range' && form.unit && (
                <p className="panel-hint">
                  Preview: <strong>{formatUnitLabel(form)}</strong>
                </p>
              )}
            </fieldset>

            <ProductImageField
              imageUrl={form.image_url}
              onImageUrlChange={(image_url) => setForm({ ...form, image_url })}
              disabled={saving}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) =>
                  setForm({ ...form, in_stock: e.target.checked })
                }
              />
              In stock
            </label>

            <fieldset className="price-type-fieldset">
              <legend>Pre-order / coming soon</legend>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.coming_soon}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      coming_soon: e.target.checked,
                      delivery_starts_at: e.target.checked
                        ? form.delivery_starts_at || '2026-07-05'
                        : '',
                    })
                  }
                />
                Show as coming soon (pre-order still allowed if in stock)
              </label>
              {form.coming_soon && (
                <label>
                  First delivery date
                  <input
                    type="date"
                    value={form.delivery_starts_at}
                    onChange={(e) =>
                      setForm({ ...form, delivery_starts_at: e.target.value })
                    }
                    required
                  />
                </label>
              )}
            </fieldset>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update' : 'Add product'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingId(null)
                    setForm({
                      ...emptyProduct,
                      category_id: subcategories[0]?.id ?? '',
                    })
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="portal-panel portal-list">
        <h2>Products ({products.length})</h2>
        {loading ? (
          <p className="status-msg">Loading…</p>
        ) : products.length === 0 ? (
          <p className="status-msg">No products yet.</p>
        ) : (
          <ul className="admin-card-list admin-product-list">
            {products.map((p) => {
              const sub = subcategories.find((c) => c.id === p.category_id)
              return (
                <li key={p.id} className="admin-card admin-product-card">
                  <div className="admin-product-thumb">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" />
                    ) : (
                      <span aria-hidden="true">🍎</span>
                    )}
                  </div>
                  <div className="admin-card-body">
                    <strong>{p.name}</strong>
                    <span className="admin-card-meta">
                      {sub ? labelFor(sub) : '—'} ·{' '}
                      {formatProductPrice(p, {
                        includeUnit: p,
                        showWasPrice: hasProductDiscount(p),
                      })}
                      {p.coming_soon ? ' · Coming soon' : ''}
                    </span>
                  </div>
                  <div className="admin-card-actions">
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => {
                        setEditingId(p.id)
                        setForm({
                          category_id: p.category_id,
                          name: p.name,
                          description: p.description ?? '',
                          price_type: p.price_type,
                          price: Number(p.price),
                          price_max: p.price_max != null ? Number(p.price_max) : null,
                          unit_type: unitTypeFromProduct(p),
                          unit: p.unit,
                          unit_min: p.unit_min != null ? Number(p.unit_min) : null,
                          unit_max: p.unit_max != null ? Number(p.unit_max) : null,
                          discount_percent:
                            p.discount_percent != null
                              ? Number(p.discount_percent)
                              : null,
                          image_url: p.image_url ?? '',
                          in_stock: p.in_stock,
                          coming_soon: p.coming_soon,
                          delivery_starts_at: p.delivery_starts_at ?? '',
                        })
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-link danger"
                      onClick={() => void handleDelete(p.id, p.name)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
