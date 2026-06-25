import { Fragment, useEffect, useMemo, useState } from 'react'
import { fetchAllProducts } from '../services/api'
import { fetchAllOrders } from '../services/ordersApi'
import {
  downloadAccountingCsv,
  filterOrdersForAccounting,
  summarizeAccounting,
  type AccountingFilters,
  type AccountingPeriod,
} from '../lib/accounting'
import {
  downloadProductVolumeCsv,
  formatWeightKg,
  summarizeProductVolume,
} from '../lib/salesVolume'
import {
  getOrderAmountReceived,
  getOrderBalanceDue,
  getOrderBoxCount,
  getOrderDeliveryCharge,
  getOrderDiscount,
  getOrderGrandTotal,
  getOrderProductTotal,
} from '../lib/orderPayment'
import { formatPricePKR } from '../config/site'
import type { Order, Product } from '../types'
import AdminPaymentEditor from './components/AdminPaymentEditor'
import './AdminAccounting.css'

const PERIOD_OPTIONS: { id: AccountingPeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom range' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { dateStyle: 'medium' })
}

export default function AdminAccounting() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<AccountingFilters>({
    period: 'month',
  })

  async function loadOrders() {
    setLoading(true)
    setError(null)
    try {
      const [orderData, productData] = await Promise.all([
        fetchAllOrders(),
        fetchAllProducts(),
      ])
      setOrders(orderData)
      setProducts(productData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const filteredOrders = useMemo(
    () =>
      [...filterOrdersForAccounting(orders, filters)].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [orders, filters],
  )

  const summary = useMemo(
    () => summarizeAccounting(filteredOrders),
    [filteredOrders],
  )

  const productVolume = useMemo(
    () => summarizeProductVolume(filteredOrders, products),
    [filteredOrders, products],
  )

  const totalWeightSold = useMemo(
    () =>
      productVolume.reduce(
        (sum, row) => sum + (row.totalWeightKg ?? 0),
        0,
      ),
    [productVolume],
  )

  function setPeriod(period: AccountingPeriod) {
    setFilters((prev) => ({ ...prev, period }))
  }

  function exportCsv() {
    const stem = `accounting-${filters.period}-${new Date().toISOString().slice(0, 10)}`
    downloadAccountingCsv(filteredOrders, stem)
  }

  function exportVolumeCsv() {
    const stem = `sales-by-product-${filters.period}-${new Date().toISOString().slice(0, 10)}`
    downloadProductVolumeCsv(productVolume, stem)
  }

  return (
    <div className="admin-accounting">
      <header className="admin-accounting-header">
        <div>
          <h2>Sales & accounting</h2>
          <p>
            Completed orders only — mark orders as <strong>completed</strong> in
            the Orders tab when done. Pending, confirmed, and cancelled orders
            are excluded from totals.
          </p>
        </div>
        <div className="admin-accounting-header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => void loadOrders()}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={exportVolumeCsv}
            disabled={productVolume.length === 0}
          >
            Export sales by product
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={exportCsv}
            disabled={filteredOrders.length === 0}
          >
            Export orders
          </button>
        </div>
      </header>

      <div className="admin-accounting-filters" role="group" aria-label="Date range">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={filters.period === option.id ? 'active' : ''}
            onClick={() => setPeriod(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filters.period === 'custom' && (
        <div className="admin-accounting-custom-range">
          <label>
            From
            <input
              type="date"
              value={filters.customFrom ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, customFrom: e.target.value }))
              }
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={filters.customTo ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, customTo: e.target.value }))
              }
            />
          </label>
        </div>
      )}

      {error && (
        <p className="admin-accounting-error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-accounting-summary">
        <article className="accounting-stat">
          <span className="accounting-stat-label">Completed orders</span>
          <strong className="accounting-stat-value">{summary.orderCount}</strong>
        </article>
        <article className="accounting-stat accounting-stat--highlight">
          <span className="accounting-stat-label">Total weight sold</span>
          <strong className="accounting-stat-value">
            {formatWeightKg(totalWeightSold > 0 ? totalWeightSold : null)}
          </strong>
        </article>
        <article className="accounting-stat accounting-stat--highlight">
          <span className="accounting-stat-label">Boxes sold</span>
          <strong className="accounting-stat-value">{summary.boxesSold}</strong>
        </article>
        <article className="accounting-stat">
          <span className="accounting-stat-label">Product sales</span>
          <strong className="accounting-stat-value">
            {formatPricePKR(summary.productSales)}
          </strong>
        </article>
        <article className="accounting-stat">
          <span className="accounting-stat-label">Delivery charges</span>
          <strong className="accounting-stat-value">
            {formatPricePKR(summary.deliveryCharges)}
          </strong>
        </article>
        <article className="accounting-stat">
          <span className="accounting-stat-label">Discounts given</span>
          <strong className="accounting-stat-value">
            {formatPricePKR(summary.discountsGiven)}
          </strong>
        </article>
        <article className="accounting-stat">
          <span className="accounting-stat-label">Amount due</span>
          <strong className="accounting-stat-value">
            {formatPricePKR(summary.grandTotal)}
          </strong>
        </article>
        <article className="accounting-stat accounting-stat--success">
          <span className="accounting-stat-label">Amount received</span>
          <strong className="accounting-stat-value">
            {formatPricePKR(summary.amountReceived)}
          </strong>
        </article>
        <article className="accounting-stat accounting-stat--warning">
          <span className="accounting-stat-label">Balance pending</span>
          <strong className="accounting-stat-value">
            {formatPricePKR(summary.balancePending)}
          </strong>
        </article>
      </div>

      {!loading && productVolume.length > 0 && (
        <section className="admin-accounting-volume" aria-label="Sales by product">
          <div className="admin-accounting-volume-header">
            <h3>Sales by product</h3>
            <p>
              Boxes and total weight per packaging size from completed orders in
              this period.
            </p>
          </div>
          <div className="admin-accounting-volume-grid">
            {productVolume.map((row) => (
              <article key={row.productId ?? row.productName} className="volume-card">
                <header className="volume-card-header">
                  <h4>{row.productName}</h4>
                  <p className="volume-card-totals">
                    <span>{row.totalBoxes} boxes</span>
                    <span aria-hidden="true">·</span>
                    <strong>{formatWeightKg(row.totalWeightKg)}</strong>
                  </p>
                </header>
                <table className="volume-card-table">
                  <thead>
                    <tr>
                      <th>Box size</th>
                      <th>Boxes</th>
                      <th>Weight sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.variants.map((variant) => (
                      <tr key={variant.sizeLabel}>
                        <td>{variant.sizeLabel}</td>
                        <td>{variant.boxesSold}</td>
                        <td>{formatWeightKg(variant.totalWeightKg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <p className="admin-accounting-status">Loading orders…</p>
      ) : filteredOrders.length === 0 ? (
        <p className="admin-accounting-status">
          No completed orders in this period. Mark finished orders as completed in
          Orders to include them here.
        </p>
      ) : (
        <div className="admin-accounting-table-wrap">
          <table className="admin-accounting-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Boxes</th>
                <th>Products</th>
                <th>Delivery</th>
                <th>Discount</th>
                <th>Due</th>
                <th>Received</th>
                <th>Balance</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const received = getOrderAmountReceived(order)
                const balance =
                  received != null
                    ? getOrderBalanceDue(order)
                    : getOrderGrandTotal(order)
                const expanded = expandedId === order.id

                return (
                  <Fragment key={order.id}>
                    <tr className={expanded ? 'expanded' : undefined}>
                      <td>{formatShortDate(order.created_at)}</td>
                      <td>
                        <strong>{order.customer_name}</strong>
                        <span className="accounting-phone">{order.phone}</span>
                      </td>
                      <td>{getOrderBoxCount(order)}</td>
                      <td>{formatPricePKR(getOrderProductTotal(order))}</td>
                      <td>{formatPricePKR(getOrderDeliveryCharge(order))}</td>
                      <td className="accounting-discount">
                        {getOrderDiscount(order) > 0
                          ? `−${formatPricePKR(getOrderDiscount(order))}`
                          : '—'}
                      </td>
                      <td>{formatPricePKR(getOrderGrandTotal(order))}</td>
                      <td>
                        {received != null ? formatPricePKR(received) : '—'}
                      </td>
                      <td
                        className={
                          balance != null && balance > 0
                            ? 'accounting-balance-due'
                            : undefined
                        }
                      >
                        {balance != null && balance > 0
                          ? formatPricePKR(balance)
                          : '—'}
                      </td>
                      <td>
                        <span
                          className={`accounting-source accounting-source--${order.order_source}`}
                        >
                          {order.order_source}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            setExpandedId(expanded ? null : order.id)
                          }
                        >
                          {expanded ? 'Close' : 'Record'}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="accounting-detail-row">
                        <td colSpan={11}>
                          <div className="accounting-detail-panel">
                            <div className="accounting-detail-meta">
                              <p>
                                <strong>Placed:</strong>{' '}
                                {formatDate(order.created_at)}
                              </p>
                              <p>
                                <strong>Status:</strong> {order.status}
                              </p>
                              {order.items?.length ? (
                                <ul className="accounting-line-items">
                                  {order.items.map((item) => (
                                    <li key={item.id}>
                                      {item.product_name} · {item.quantity} box
                                      {item.quantity === 1 ? '' : 'es'} ·{' '}
                                      {formatPricePKR(item.line_total)}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                            <AdminPaymentEditor
                              order={order}
                              onSaved={() => {
                                void loadOrders()
                                setExpandedId(null)
                              }}
                              compact
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
