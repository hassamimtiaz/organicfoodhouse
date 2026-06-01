import { useState, type FormEvent } from 'react'
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from '../../services/adminApi'
import { formatSubcategoryLabel } from '../../services/api'
import { formatProductPrice } from '../../config/pricing'
import type { Category, Product, ProductFormData, PriceType } from '../../types'
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
  unit: 'kg',
  image_url: '',
  in_stock: true,
}

export default function AdminProducts({
  topLevel,
  subcategories,
  products,
  loading,
  onSaved,
  onMessage,
}: Props) {
  const [form, setForm] = useState<ProductFormData>({
    ...emptyProduct,
    category_id: subcategories[0]?.id ?? '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function labelFor(sub: Category) {
    return formatSubcategoryLabel(sub, topLevel)
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
            </fieldset>

            <label>
              Unit
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="kg, dozen, box…"
                required
              />
            </label>

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
                      {formatProductPrice(p, { includeUnit: p.unit })}
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
                          unit: p.unit,
                          image_url: p.image_url ?? '',
                          in_stock: p.in_stock,
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
