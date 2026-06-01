import { useState, type FormEvent } from 'react'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../../services/adminApi'
import type { Category, CategoryFormData } from '../../types'

interface Props {
  categories: Category[]
  loading: boolean
  onSaved: () => Promise<void>
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

const emptyForm: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  parent_id: null,
}

export default function AdminMajorCategories({
  categories,
  loading,
  onSaved,
  onMessage,
}: Props) {
  const [form, setForm] = useState<CategoryFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function slugFromName(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, parent_id: null }
      if (editingId) {
        await updateCategory(editingId, payload)
        onMessage({ type: 'success', text: 'Major category updated.' })
      } else {
        await createCategory(payload)
        onMessage({ type: 'success', text: 'Major category added.' })
      }
      setForm(emptyForm)
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
    if (
      !confirm(
        `Delete major category "${name}"? All subcategories and products under it will be removed.`,
      )
    )
      return
    try {
      await deleteCategory(id)
      onMessage({ type: 'success', text: 'Category deleted.' })
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
        <h2>{editingId ? 'Edit major category' : 'Add major category'}</h2>
        <p className="panel-hint">
          Top-level groups such as Fruits, Vegetables, or Grains.
        </p>
        <form onSubmit={handleSubmit} className="admin-form">
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
              placeholder="e.g. Fruits"
              required
            />
          </label>
          <label>
            Slug (URL)
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="fruits"
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
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update' : 'Add category'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="portal-panel portal-list">
        <h2>Major categories ({categories.length})</h2>
        {loading ? (
          <p className="status-msg">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="status-msg">No major categories yet.</p>
        ) : (
          <ul className="admin-card-list">
            {categories.map((c) => (
              <li key={c.id} className="admin-card">
                <div className="admin-card-body">
                  <strong>{c.name}</strong>
                  <span className="admin-card-meta">/{c.slug}</span>
                  {c.description && (
                    <p className="admin-card-desc">{c.description}</p>
                  )}
                </div>
                <div className="admin-card-actions">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setEditingId(c.id)
                      setForm({
                        name: c.name,
                        slug: c.slug,
                        description: c.description ?? '',
                        parent_id: null,
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
