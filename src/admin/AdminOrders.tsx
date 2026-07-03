import { useEffect, useMemo, useState } from 'react'
import {
  deleteOrder,
  fetchAllOrders,
  updateOrderStatus,
} from '../services/ordersApi'
import { downloadOrderInvoiceHtml } from '../lib/invoice'
import {
  formatOrderPackCount,
  formatOrderPackSize,
  formatOrderStatus,
} from '../lib/orderDisplay'
import {
  getOrderAmountReceived,
  getOrderBalanceDue,
} from '../lib/orderPayment'
import { formatPricePKR } from '../config/site'
import type { Order, OrderStatus, Product } from '../types'
import AdminManualOrderForm from './components/AdminManualOrderForm'
import AdminPaymentEditor from './components/AdminPaymentEditor'
import './AdminOrders.css'

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'ready_for_dispatch',
  'completed',
  'cancelled',
]

type StatusFilter = 'all' | OrderStatus

const STATUS_FILTER_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'ready_for_dispatch', label: 'Ready for dispatch' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
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
        const isWhatsapp = order.order_source === 'whatsapp'
        const amountReceived = getOrderAmountReceived(order)

        return (
          <article
            key={order.id}
            className={`order-card ${isPreorder ? 'order-card--preorder' : 'order-card--current'}${isWhatsapp ? ' order-card--whatsapp' : ''}`}
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
                {isWhatsapp && (
                  <span className="order-type-pill order-type-pill--whatsapp">
                    WhatsApp
                  </span>
                )}
                <span className={`status-pill status-${order.status}`}>
                  {formatOrderStatus(order.status)}
                </span>
              </div>
              <div className="order-card-meta">
                <span>{formatDate(order.created_at)}</span>
                <span>{order.phone}</span>
                <span>{formatPricePKR(Number(order.total))}</span>
                {amountReceived != null && (
                  <span className="order-advance-chip">
                    Received {formatPricePKR(amountReceived)}
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
                          {formatOrderStatus(s)}
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
                  {order.admin_notes && (
                    <p className="order-admin-notes">
                      <strong>Admin / accounting:</strong> {order.admin_notes}
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
                            <th>Boxes</th>
                            <th>Box size</th>
                            <th>Price / box</th>
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
                        {amountReceived != null && (
                          <div>
                            <dt>Amount received</dt>
                            <dd>{formatPricePKR(amountReceived)}</dd>
                          </div>
                        )}
                        {getOrderBalanceDue(order) != null && (
                          <div>
                            <dt>Balance due</dt>
                            <dd>{formatPricePKR(getOrderBalanceDue(order)!)}</dd>
                          </div>
                        )}
                      </dl>
                      <AdminPaymentEditor
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

export default function AdminOrders({ products }: { products: Product[] }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  const { whatsappOrders, preorders, currentOrders } = useMemo(() => {
    const whatsappOrders = filteredOrders.filter(
      (o) => o.order_source === 'whatsapp',
    )
    const preorders = filteredOrders.filter(
      (o) => o.order_source !== 'whatsapp' && o.order_type === 'preorder',
    )
    const currentOrders = filteredOrders.filter(
      (o) => o.order_source !== 'whatsapp' && o.order_type !== 'preorder',
    )
    return { whatsappOrders, preorders, currentOrders }
  }, [filteredOrders])

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

  async function handlePaymentSaved() {
    setMessage('Payment details updated.')
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
        <h2>
          Orders ({statusFilter === 'all' ? orders.length : filteredOrders.length}
          {statusFilter !== 'all' ? ` of ${orders.length}` : ''})
        </h2>
        <div className="admin-orders-header-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddOrder((v) => !v)}
          >
            {showAddOrder ? 'Close form' : '+ Add WhatsApp order'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void loadOrders()}
          >
            Refresh
          </button>
        </div>
      </div>

      {message && <p className="admin-orders-msg">{message}</p>}

      {!loading && orders.length > 0 && (
        <div
          className="admin-orders-filters"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={statusFilter === option.id ? 'active' : ''}
              onClick={() => setStatusFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {showAddOrder && (
        <AdminManualOrderForm
          products={products}
          onCreated={() => {
            setShowAddOrder(false)
            setMessage('WhatsApp order saved.')
            void loadOrders()
          }}
          onCancel={() => setShowAddOrder(false)}
        />
      )}

      {loading ? (
        <p className="status-msg">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="status-msg">No orders yet. Add a WhatsApp order to get started.</p>
      ) : filteredOrders.length === 0 ? (
        <p className="status-msg">
          No {statusFilter} orders. Try another status or show all.
        </p>
      ) : (
        <>
          <div className="admin-orders-section">
            <div className="admin-orders-section-head">
              <h3>WhatsApp orders</h3>
              <span className="admin-orders-count">{whatsappOrders.length}</span>
            </div>
            <p className="admin-orders-section-desc">
              Orders recorded manually from WhatsApp or phone.
            </p>
            <OrderList
              orders={whatsappOrders}
              allOrders={orders}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onStatusChange={(id, status) => void handleStatusChange(id, status)}
              onAdvanceSaved={() => void handlePaymentSaved()}
              onDelete={(id) => void handleDelete(id)}
            />
          </div>

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
              onAdvanceSaved={() => void handlePaymentSaved()}
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
              onAdvanceSaved={() => void handlePaymentSaved()}
              onDelete={(id) => void handleDelete(id)}
            />
          </div>
        </>
      )}
    </section>
  )
}
