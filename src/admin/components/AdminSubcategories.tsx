import { useState, type FormEvent } from 'react'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../../services/adminApi'
import type { Category, CategoryFormData } from '../../types'

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
              <li key={c.id} className="admin-card">
                <div className="admin-card-body">
                  <span className="admin-card-parent">
                    {parentName(c.parent_id)}
                  </span>
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
                        parent_id: c.parent_id,
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
