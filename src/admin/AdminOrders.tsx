import { useEffect, useMemo, useState } from 'react'
import {
  deleteOrder,
  fetchAllOrders,
  updateOrderAdvancePayment,
  updateOrderStatus,
} from '../services/ordersApi'
import { downloadOrderInvoiceHtml } from '../lib/invoice'
import {
  formatOrderPackCount,
  formatOrderPackSize,
} from '../lib/orderDisplay'
import { parseAdvancePayment } from '../lib/orderNormalize'
import { formatPricePKR } from '../config/site'
import type { Order, OrderStatus } from '../types'
import './AdminOrders.css'

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function AdvancePaymentEditor({
  order,
  onSaved,
}: {
  order: Order
  onSaved: () => void
}) {
  const [value, setValue] = useState(
    order.advance_payment != null && order.advance_payment > 0
      ? String(order.advance_payment)
      : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setValue(
      order.advance_payment != null && order.advance_payment > 0
        ? String(order.advance_payment)
        : '',
    )
  }, [order.id, order.advance_payment])

  const recorded = order.advance_payment != null && order.advance_payment > 0
  const balance =
    recorded && order.advance_payment != null
      ? Math.max(0, Number(order.total) - order.advance_payment)
      : null

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const amount = value.trim() === '' ? null : parseAdvancePayment(value)
      if (value.trim() !== '' && amount == null) {
        setError('Enter a valid amount in PKR.')
        return
      }
      await updateOrderAdvancePayment(order.id, amount)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save advance payment')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    if (!confirm('Clear recorded advance payment for this order?')) return
    setSaving(true)
    setError(null)
    try {
      await updateOrderAdvancePayment(order.id, null)
      setValue('')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not clear advance payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="order-advance-editor">
      <p className="order-advance-editor-hint">
        Record advance payment when the customer pays outside the website (cash,
        bank transfer, etc.).
      </p>
      <label className="order-advance-label">
        Advance received (PKR)
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 1000"
          disabled={saving}
        />
      </label>
      {recorded && balance != null && (
        <p className="order-advance-balance">
          <strong>Balance due:</strong> {formatPricePKR(balance)}
        </p>
      )}
      {error && (
        <p className="order-advance-error" role="alert">
          {error}
        </p>
      )}
      <div className="order-advance-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? 'Saving…' : 'Save advance'}
        </button>
        {recorded && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={saving}
            onClick={() => void handleClear()}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function OrderList({
  orders,
  allOrders,
  expandedId,
  setExpandedId,
  onStatusChange,
  onAdvanceSaved,
  onDelete,
}: {
  orders: Order[]
  allOrders: Order[]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  onStatusChange: (orderId: string, status: OrderStatus) => void
  onAdvanceSaved: () => void
  onDelete: (orderId: string) => void
}) {
  const invoiceContext = { allOrders }
  if (orders.length === 0) {
    return <p className="status-msg admin-orders-empty">None in this section.</p>
  }

  return (
    <div className="orders-list">
      {orders.map((order) => {
        const expanded = expandedId === order.id
        const isPreorder = order.order_type === 'preorder'

        return (
          <article
            key={order.id}
            className={`order-card ${isPreorder ? 'order-card--preorder' : 'order-card--current'}`}
          >
            <button
              type="button"
              className="order-card-summary"
              onClick={() => setExpandedId(expanded ? null : order.id)}
            >
              <div className="order-card-main">
                <strong>{order.customer_name}</strong>
                <span
                  className={`order-type-pill ${isPreorder ? 'order-type-pill--preorder' : 'order-type-pill--current'}`}
                >
                  {isPreorder ? 'Pre-order' : 'Current order'}
                </span>
                <span className={`status-pill status-${order.status}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-card-meta">
                <span>{formatDate(order.created_at)}</span>
                <span>{order.phone}</span>
                <span>{formatPricePKR(Number(order.total))}</span>
                {order.advance_payment != null && order.advance_payment > 0 && (
                  <span className="order-advance-chip">
                    Advance {formatPricePKR(order.advance_payment)}
                  </span>
                )}
              </div>
            </button>

            {expanded && (
              <div className="order-card-details">
                <div className="order-details-toolbar">
                  <dl className="order-contact-dl">
                    <div>
                      <dt>Customer</dt>
                      <dd>{order.customer_name}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{order.phone}</dd>
                    </div>
                    {order.email && (
                      <div>
                        <dt>Email</dt>
                        <dd>{order.email}</dd>
                      </div>
                    )}
                  </dl>
                  <label className="order-status-field">
                    <span>Status</span>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        onStatusChange(order.id, e.target.value as OrderStatus)
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <section className="order-delivery-panel">
                  <h4>Delivery address</h4>
                  <p className="order-address-text">
                    {order.address_line}
                    <br />
                    <span className="order-address-city">{order.city}</span>
                  </p>
                  {order.notes && (
                    <p className="order-notes">
                      <strong>Customer note:</strong> {order.notes}
                    </p>
                  )}
                </section>

                <div className="order-details-body">
                  {order.items && order.items.length > 0 && (
                    <div className="order-items-panel">
                      <h4>Items</h4>
                      <table className="order-items-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Packs</th>
                            <th>Pack size</th>
                            <th>Price / pack</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.product_name}</td>
                              <td>{formatOrderPackCount(item.quantity)}</td>
                              <td>{formatOrderPackSize(item.unit)}</td>
                              <td>
                                {formatPricePKR(Number(item.unit_price))}
                              </td>
                              <td>
                                {formatPricePKR(Number(item.line_total))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="order-items-footer">
                        <section className="order-invoice-actions">
                          <h4>Invoice</h4>
                          <p className="order-invoice-hint">
                            Download and share with the customer.
                          </p>
                          <div className="order-invoice-buttons">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() =>
                                downloadOrderInvoiceHtml(
                                  order,
                                  invoiceContext,
                                )
                              }
                            >
                              Download as HTML
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                void (async () => {
                                  try {
                                    const { downloadOrderInvoicePdf } =
                                      await import('../lib/invoicePdf')
                                    downloadOrderInvoicePdf(
                                      order,
                                      invoiceContext,
                                    )
                                  } catch (e) {
                                    alert(
                                      e instanceof Error
                                        ? e.message
                                        : 'Could not generate PDF',
                                    )
                                  }
                                })()
                              }}
                            >
                              Download as PDF
                            </button>
                          </div>
                        </section>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-danger order-remove-btn"
                          onClick={() => onDelete(order.id)}
                        >
                          Remove order
                        </button>
                      </div>
                    </div>
                  )}

                  <aside className="order-sidebar">
                    <section className="order-payment-panel">
                      <h4>Payment</h4>
                      <dl className="order-payment-dl">
                        <div>
                          <dt>Order total</dt>
                          <dd>{formatPricePKR(Number(order.total))}</dd>
                        </div>
                        {order.advance_payment != null &&
                          order.advance_payment > 0 && (
                            <div>
                              <dt>Advance recorded</dt>
                              <dd>
                                {formatPricePKR(order.advance_payment)}
                              </dd>
                            </div>
                          )}
                      </dl>
                      <AdvancePaymentEditor
                        order={order}
                        onSaved={onAdvanceSaved}
                      />
                    </section>
                  </aside>
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { preorders, currentOrders } = useMemo(() => {
    const preorders = orders.filter((o) => o.order_type === 'preorder')
    const currentOrders = orders.filter((o) => o.order_type !== 'preorder')
    return { preorders, currentOrders }
  }, [orders])

  async function loadOrders() {
    setLoading(true)
    try {
      setOrders(await fetchAllOrders())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      await updateOrderStatus(orderId, status)
      setMessage('Order status updated.')
      await loadOrders()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update failed')
    }
  }

  async function handleAdvanceSaved() {
    setMessage('Advance payment updated.')
    await loadOrders()
  }

  async function handleDelete(orderId: string) {
    if (!confirm('Remove this order permanently? This cannot be undone.')) return
    try {
      await deleteOrder(orderId)
      setMessage('Order removed.')
      if (expandedId === orderId) setExpandedId(null)
      await loadOrders()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <section className="admin-orders">
      <div className="admin-orders-header">
        <h2>Orders ({orders.length})</h2>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => void loadOrders()}
        >
          Refresh
        </button>
      </div>

      {message && <p className="admin-orders-msg">{message}</p>}

      {loading ? (
        <p className="status-msg">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="status-msg">No orders yet.</p>
      ) : (
        <>
          <div className="admin-orders-section">
            <div className="admin-orders-section-head">
              <h3>Pre-orders</h3>
              <span className="admin-orders-count">{preorders.length}</span>
            </div>
            <p className="admin-orders-section-desc">
              Reservations for coming-soon products (e.g. seasonal pre-order).
            </p>
            <OrderList
              orders={preorders}
              allOrders={orders}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onStatusChange={(id, status) => void handleStatusChange(id, status)}
              onAdvanceSaved={() => void handleAdvanceSaved()}
              onDelete={(id) => void handleDelete(id)}
            />
          </div>

          <div className="admin-orders-section">
            <div className="admin-orders-section-head">
              <h3>Current orders</h3>
              <span className="admin-orders-count">{currentOrders.length}</span>
            </div>
            <p className="admin-orders-section-desc">
              Standard website orders for in-season, available products.
            </p>
            <OrderList
              orders={currentOrders}
              allOrders={orders}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onStatusChange={(id, status) => void handleStatusChange(id, status)}
              onAdvanceSaved={() => void handleAdvanceSaved()}
              onDelete={(id) => void handleDelete(id)}
            />
          </div>
        </>
      )}
    </section>
  )
}
