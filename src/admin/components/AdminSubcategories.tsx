import { useEffect, useState, type FormEvent } from 'react'
import {
  createCategory,
  deleteCategory,
  setCategoryVisibility,
  updateCategory,
  uploadCategoryImage,
} from '../../services/adminApi'
import type { Category, CategoryFormData } from '../../types'
import ImageUploadField from './ImageUploadField'

interface Props {
  topLevel: Category[]
  subcategories: Category[]
  loading: boolean
  onSaved: () => Promise<void>
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

const emptyForm: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  parent_id: '',
  image_url: '',
  is_visible: true,
}

export default function AdminSubcategories({
  topLevel,
  subcategories,
  loading,
  onSaved,
  onMessage,
}: Props) {
  const [form, setForm] = useState<CategoryFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (editingId || topLevel.length === 0) return
    setForm((current) => {
      if (current.parent_id) return current
      return { ...current, parent_id: topLevel[0].id }
    })
  }, [topLevel, editingId])

  function slugFromName(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.parent_id) {
      onMessage({ type: 'error', text: 'Select a parent major category.' })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, parent_id: form.parent_id }
      if (editingId) {
        await updateCategory(editingId, payload)
        onMessage({ type: 'success', text: 'Subcategory updated.' })
      } else {
        await createCategory(payload)
        onMessage({ type: 'success', text: 'Subcategory added.' })
      }
      setForm({ ...emptyForm, parent_id: topLevel[0]?.id ?? '' })
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

  async function handleToggleVisibility(category: Category) {
    const next = !category.is_visible
    const action = next ? 'shown on' : 'hidden from'
    if (
      !next &&
      !confirm(
        `Hide "${category.name}" from the store? Products in this subcategory will no longer appear on the website.`,
      )
    ) {
      return
    }

    setTogglingId(category.id)
    try {
      await setCategoryVisibility(category.id, next)
      onMessage({
        type: 'success',
        text: `"${category.name}" ${action} the store.`,
      })
      await onSaved()
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Update failed',
      })
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Delete subcategory "${name}"? Products in this subcategory will be removed.`,
      )
    )
      return
    try {
      await deleteCategory(id)
      onMessage({ type: 'success', text: 'Subcategory deleted.' })
      await onSaved()
    } catch (err) {
      onMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Delete failed',
      })
    }
  }

  function parentName(parentId: string | null) {
    return topLevel.find((t) => t.id === parentId)?.name ?? '—'
  }

  return (
    <div className="portal-grid">
      <section className="portal-panel">
        <h2>{editingId ? 'Edit subcategory' : 'Add subcategory'}</h2>
        <p className="panel-hint">
          Link a subcategory to a major category (e.g. Mangoes under Fruits).
        </p>
        {topLevel.length === 0 ? (
          <p className="status-msg">
            Add a major category first, then create subcategories here.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="admin-form">
            <label>
              Parent category
              <select
                value={form.parent_id ?? ''}
                onChange={(e) =>
                  setForm({ ...form, parent_id: e.target.value })
                }
                required
              >
                <option value="">Select major category</option>
                {topLevel.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.is_visible ? ' (hidden)' : ''}
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
                placeholder="e.g. Mangoes"
                required
              />
            </label>
            <label>
              Slug (URL)
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="mangoes"
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

            <ImageUploadField
              label="Subcategory image"
              imageUrl={form.image_url}
              onImageUrlChange={(image_url) => setForm({ ...form, image_url })}
              onUpload={uploadCategoryImage}
              disabled={saving}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.is_visible}
                onChange={(e) =>
                  setForm({ ...form, is_visible: e.target.checked })
                }
              />
              Visible on store
            </label>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Add subcategory'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingId(null)
                    setForm({ ...emptyForm, parent_id: topLevel[0]?.id ?? '' })
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
        <h2>Subcategories ({subcategories.length})</h2>
        {loading ? (
          <p className="status-msg">Loading…</p>
        ) : subcategories.length === 0 ? (
          <p className="status-msg">No subcategories yet.</p>
        ) : (
          <ul className="admin-card-list">
            {subcategories.map((c) => (
              <li
                key={c.id}
                className={`admin-card ${!c.is_visible ? 'admin-card-hidden' : ''}`}
              >
                {c.image_url && (
                  <div className="admin-category-thumb">
                    <img src={c.image_url} alt="" />
                  </div>
                )}
                <div className="admin-card-body">
                  <span className="admin-card-parent">
                    {parentName(c.parent_id)}
                  </span>
                  <strong>{c.name}</strong>
                  {!c.is_visible && (
                    <span className="admin-hidden-badge">Hidden from store</span>
                  )}
                  <span className="admin-card-meta">/{c.slug}</span>
                  {c.description && (
                    <p className="admin-card-desc">{c.description}</p>
                  )}
                </div>
                <div className="admin-card-actions">
                  <button
                    type="button"
                    className="btn-link"
                    disabled={togglingId === c.id}
                    onClick={() => void handleToggleVisibility(c)}
                  >
                    {togglingId === c.id
                      ? 'Updating…'
                      : c.is_visible
                        ? 'Hide from store'
                        : 'Show on store'}
                  </button>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setEditingId(c.id)
                      setForm({
                        name: c.name,
                        slug: c.slug,
                        description: c.description ?? '',
                        parent_id: c.parent_id,
                        image_url: c.image_url ?? '',
                        is_visible: c.is_visible,
                      })
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-link danger"
                    onClick={() => void handleDelete(c.id, c.name)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
