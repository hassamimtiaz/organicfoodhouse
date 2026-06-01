import { useEffect, useState } from 'react'
import { fetchAllOrders, updateOrderStatus } from '../services/ordersApi'
import { formatPricePKR } from '../config/site'
import type { Order, OrderStatus } from '../types'
import './AdminOrders.css'

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
]

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
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
        <div className="orders-list">
          {orders.map((order) => {
            const expanded = expandedId === order.id
            return (
              <article key={order.id} className="order-card">
                <button
                  type="button"
                  className="order-card-summary"
                  onClick={() =>
                    setExpandedId(expanded ? null : order.id)
                  }
                >
                  <div className="order-card-main">
                    <strong>{order.customer_name}</strong>
                    <span className={`status-pill status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-card-meta">
                    <span>{formatDate(order.created_at)}</span>
                    <span>{order.phone}</span>
                    <span>{formatPricePKR(Number(order.total))}</span>
                  </div>
                </button>

                {expanded && (
                  <div className="order-card-details">
                    <div className="order-detail-grid">
                      <div>
                        <h4>Customer</h4>
                        <p>{order.customer_name}</p>
                        <p>{order.phone}</p>
                        {order.email && <p>{order.email}</p>}
                      </div>
                      <div>
                        <h4>Delivery</h4>
                        <p>{order.address_line}</p>
                        <p>{order.city}</p>
                        {order.notes && (
                          <p className="order-notes">Note: {order.notes}</p>
                        )}
                      </div>
                      <div>
                        <h4>Status</h4>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            void handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <table className="order-items-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.product_name}</td>
                              <td>
                                {item.quantity} {item.unit}
                              </td>
                              <td>{formatPricePKR(Number(item.unit_price))}</td>
                              <td>{formatPricePKR(Number(item.line_total))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
