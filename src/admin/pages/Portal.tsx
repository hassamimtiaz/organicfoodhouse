import { useEffect, useState } from 'react'
import {
  fetchAllProducts,
  fetchAllSubcategories,
  fetchTopLevelCategories,
} from '../../services/api'
import type { Category, Product } from '../../types'
import AdminOrders from '../AdminOrders'
import AdminAccounting from '../AdminAccounting'
import AdminMajorCategories from '../components/AdminMajorCategories'
import AdminSubcategories from '../components/AdminSubcategories'
import AdminProducts from '../components/AdminProducts'
import './Portal.css'

type Tab = 'major' | 'subcategories' | 'products' | 'orders' | 'accounting'

export default function AdminPortal() {
  const [tab, setTab] = useState<Tab>('products')
  const [topLevel, setTopLevel] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [top, subs, prods] = await Promise.all([
        fetchTopLevelCategories({ includeHidden: true }),
        fetchAllSubcategories({ includeHidden: true }),
        fetchAllProducts(),
      ])
      setTopLevel(top)
      setSubcategories(subs)
      setProducts(prods)
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Failed to load',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function setMsg(msg: { type: 'success' | 'error'; text: string }) {
    if (msg.text) setMessage(msg)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'major', label: 'Major categories' },
    { id: 'subcategories', label: 'Subcategories' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'accounting', label: 'Accounting' },
  ]

  return (
    <div className="portal">
      <div className="container">
        <header className="portal-header">
          <div>
            <h1>Catalog management</h1>
            <p>
              Step 1: major categories → Step 2: subcategories → Step 3:
              products
            </p>
          </div>
        </header>

        {message && (
          <div className={`alert alert-${message.type}`} role="status">
            {message.text}
          </div>
        )}

        <div className="portal-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'orders' && <AdminOrders products={products} />}

        {tab === 'accounting' && <AdminAccounting />}

        {tab === 'major' && (
          <AdminMajorCategories
            categories={topLevel}
            loading={loading}
            onSaved={loadData}
            onMessage={setMsg}
          />
        )}

        {tab === 'subcategories' && (
          <AdminSubcategories
            topLevel={topLevel}
            subcategories={subcategories}
            loading={loading}
            onSaved={loadData}
            onMessage={setMsg}
          />
        )}

        {tab === 'products' && (
          <AdminProducts
            topLevel={topLevel}
            subcategories={subcategories}
            products={products}
            loading={loading}
            onSaved={loadData}
            onMessage={setMsg}
          />
        )}
      </div>
    </div>
  )
}
