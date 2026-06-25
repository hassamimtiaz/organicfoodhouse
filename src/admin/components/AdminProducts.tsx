import { useEffect, useState, type FormEvent } from 'react'
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from '../../services/adminApi'
import { formatSubcategoryLabel } from '../../services/api'
import { formatProductPrice, hasProductDiscount } from '../../config/pricing'
import { formatPackagingLabel, hasPackagings } from '../../config/packaging'
import { getProductPrimaryImage } from '../../config/productImages'
import { formatPricePKR } from '../../config/site'
import { formatUnitLabel } from '../../config/units'
import { slugFromName } from '../../lib/slugify'
import ProductImagesField from './ProductImagesField'
import type {
  Category,
  Product,
  ProductFormData,
  ProductImageFormData,
  ProductPackagingFormData,
  PriceType,
  UnitType,
} from '../../types'

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
  slug: '',
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
  packagings: [],
  images: [],
}

function imagesFromProduct(product: Product): ProductImageFormData[] {
  if (product.images?.length) {
    return product.images.map((row) => ({
      id: row.id,
      image_url: row.image_url,
      sort_order: row.sort_order,
    }))
  }
  if (product.image_url?.trim()) {
    return [{ image_url: product.image_url.trim() }]
  }
  return []
}

function emptyPackagingRow(): ProductPackagingFormData {
  return {
    label: '',
    weight: 5,
    unit: 'kg',
    price: 0,
    sort_order: 0,
    in_stock: true,
    stock_quantity: null,
  }
}

function packagingsFromProduct(product: Product): ProductPackagingFormData[] {
  return (product.packagings ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    weight: Number(row.weight),
    unit: row.unit,
    price: Number(row.price),
    sort_order: row.sort_order,
    in_stock: row.in_stock,
    stock_quantity: row.stock_quantity ?? null,
  }))
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

  function addPackagingRow() {
    setForm((f) => ({
      ...f,
      packagings: [...f.packagings, emptyPackagingRow()],
    }))
  }

  function updatePackagingRow(
    index: number,
    patch: Partial<ProductPackagingFormData>,
  ) {
    setForm((f) => ({
      ...f,
      packagings: f.packagings.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }))
  }

  function removePackagingRow(index: number) {
    setForm((f) => ({
      ...f,
      packagings: f.packagings.filter((_, i) => i !== index),
    }))
  }

  const usesPackagings = form.packagings.length > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.category_id) {
      onMessage({ type: 'error', text: 'Select a subcategory.' })
      return
    }

    if (usesPackagings) {
      for (const [index, row] of form.packagings.entries()) {
        if (!row.label.trim()) {
          onMessage({
            type: 'error',
            text: `Box option ${index + 1}: enter a label (e.g. Gift box).`,
          })
          return
        }
        if (row.weight <= 0) {
          onMessage({
            type: 'error',
            text: `Box option ${index + 1}: weight must be greater than zero.`,
          })
          return
        }
        if (row.price <= 0) {
          onMessage({
            type: 'error',
            text: `Box option ${index + 1}: enter a price in PKR.`,
          })
          return
        }
      }
    } else if (form.price <= 0) {
      onMessage({ type: 'error', text: 'Enter a product price.' })
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
          <form onSubmit={handleSubmit} className="admin-form" noValidate>
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
                onChange={(e) => {
                  const name = e.target.value
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editingId ? f.slug : slugFromName(name),
                  }))
                }}
                placeholder="e.g. Dasheri"
                required
              />
            </label>
            <label>
              URL slug
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. chaunsa-mango"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Lowercase letters, numbers, and hyphens only"
                required
              />
              <span className="field-hint">
                Product page: /product/{form.slug || 'your-slug'}
              </span>
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

            <ProductImagesField
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
              disabled={saving}
            />

            <fieldset className="price-type-fieldset packaging-fieldset">
              <legend>Box options &amp; pricing</legend>
              <p className="field-hint packaging-fieldset-intro">
                Add box sizes with a fixed price each — e.g. 5 kg Premium gift
                box at Rs 2,500. Leave empty to use a single product price
                instead.
              </p>

              {form.packagings.length > 0 && (
                <div className="packaging-admin-list">
                  {form.packagings.map((row, index) => (
                    <div
                      key={row.id ?? `new-${index}`}
                      className="packaging-admin-card"
                    >
                      <div className="packaging-admin-card-header">
                        <span className="packaging-admin-card-title">
                          Option {index + 1}
                        </span>
                        <button
                          type="button"
                          className="btn-link danger"
                          onClick={() => removePackagingRow(index)}
                        >
                          Remove
                        </button>
                      </div>

                      <label className="packaging-admin-label-full">
                        Box name
                        <input
                          value={row.label}
                          onChange={(e) =>
                            updatePackagingRow(index, { label: e.target.value })
                          }
                          placeholder="e.g. Premium gift box"
                        />
                      </label>

                      <div className="packaging-admin-metrics">
                        <label>
                          Weight
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            inputMode="decimal"
                            value={row.weight > 0 ? row.weight : ''}
                            onChange={(e) =>
                              updatePackagingRow(index, {
                                weight:
                                  e.target.value === ''
                                    ? 0
                                    : parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="5"
                          />
                        </label>
                        <label>
                          Unit
                          <input
                            value={row.unit}
                            onChange={(e) =>
                              updatePackagingRow(index, { unit: e.target.value })
                            }
                            placeholder="kg"
                          />
                        </label>
                        <label>
                          Price (PKR)
                          <input
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            value={row.price > 0 ? row.price : ''}
                            onChange={(e) =>
                              updatePackagingRow(index, {
                                price:
                                  e.target.value === ''
                                    ? 0
                                    : parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="2500"
                          />
                        </label>
                      </div>

                      <label className="packaging-admin-label-full">
                        Boxes in stock
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={
                            row.stock_quantity != null ? row.stock_quantity : ''
                          }
                          onChange={(e) =>
                            updatePackagingRow(index, {
                              stock_quantity:
                                e.target.value === ''
                                  ? null
                                  : Math.max(
                                      0,
                                      parseInt(e.target.value, 10) || 0,
                                    ),
                              in_stock:
                                e.target.value === ''
                                  ? row.in_stock
                                  : (parseInt(e.target.value, 10) || 0) > 0,
                            })
                          }
                          placeholder="Leave empty for unlimited"
                        />
                      </label>
                      <p className="field-hint packaging-stock-hint">
                        Set how many boxes are left for this size. At 0 it goes
                        out of stock automatically. Leave empty if you do not
                        track quantity.
                      </p>

                      <label className="checkbox-label packaging-admin-stock">
                        <input
                          type="checkbox"
                          checked={row.in_stock}
                          disabled={row.stock_quantity != null}
                          onChange={(e) =>
                            updatePackagingRow(index, {
                              in_stock: e.target.checked,
                            })
                          }
                        />
                        {row.stock_quantity != null
                          ? 'In stock (auto from quantity above)'
                          : 'Available to order'}
                      </label>

                      <p className="packaging-admin-preview">
                        <span>Customer sees:</span>{' '}
                        <strong>
                          {formatPackagingLabel({
                            id: row.id ?? 'preview',
                            product_id: '',
                            label: row.label.trim() || 'Gift box',
                            weight: row.weight > 0 ? row.weight : 5,
                            unit: row.unit.trim() || 'kg',
                            price: row.price,
                            sort_order: index,
                            in_stock: row.in_stock,
                            stock_quantity: row.stock_quantity,
                          })}
                          {row.price > 0
                            ? ` — ${formatPricePKR(row.price)}`
                            : ''}
                        </strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="btn btn-outline btn-sm packaging-admin-add"
                onClick={addPackagingRow}
              >
                + Add box option
              </button>

              {usesPackagings && (
                <>
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
                    Apply discount to all box sizes
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
                      />
                    </label>
                  )}

                  <p className="field-hint">
                    Shop cards show <strong>From</strong> the lowest box price.
                    Customers pick a size on the product page.
                  </p>
                </>
              )}
            </fieldset>

            {!usesPackagings && (
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
                  />
                </label>
              )}

              {(form.discount_percent != null && form.discount_percent > 0) && (
                <p className="panel-hint">
                  Customer price preview:{' '}
                  <strong>
                    {formatProductPrice(
                      {
                        price: form.price,
                        price_max: form.price_max,
                        price_type: form.price_type,
                        discount_percent: form.discount_percent,
                      },
                      {
                        includeUnit: form,
                        showWasPrice: true,
                      },
                    )}
                  </strong>
                </p>
              )}
            </fieldset>
            )}

            {!usesPackagings && (
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
            )}

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
                    {getProductPrimaryImage(p) ? (
                      <img src={getProductPrimaryImage(p)!} alt="" />
                    ) : (
                      <span aria-hidden="true">
                        {p.name.toLowerCase().includes('mango') ? '🥭' : '🍎'}
                      </span>
                    )}
                  </div>
                  <div className="admin-card-body">
                    <strong>{p.name}</strong>
                    <span className="admin-card-meta">
                      {sub ? labelFor(sub) : '—'} · /{p.slug} ·{' '}
                      {hasPackagings(p)
                        ? ` · ${p.packagings!.map((row) => formatPackagingLabel(row)).join(' · ')}`
                        : ` · ${formatProductPrice(p, {
                            includeUnit: p,
                            showWasPrice: hasProductDiscount(p),
                          })}`}
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
                          slug: p.slug,
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
                          images: imagesFromProduct(p),
                          in_stock: p.in_stock,
                          coming_soon: p.coming_soon,
                          delivery_starts_at: p.delivery_starts_at ?? '',
                          packagings: packagingsFromProduct(p),
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
