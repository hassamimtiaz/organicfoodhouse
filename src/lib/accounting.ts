import type { Order } from '../types'
import {
  getOrderAmountReceived,
  getOrderBalanceDue,
  getOrderBoxCount,
  getOrderDeliveryCharge,
  getOrderDiscount,
  getOrderGrandTotal,
  getOrderProductTotal,
} from './orderPayment'

export type AccountingPeriod =
  | 'today'
  | 'week'
  | 'month'
  | 'all'
  | 'custom'

export interface AccountingDateRange {
  from: Date
  to: Date
}

export interface AccountingSummary {
  orderCount: number
  boxesSold: number
  productSales: number
  deliveryCharges: number
  discountsGiven: number
  grandTotal: number
  amountReceived: number
  balancePending: number
}

export interface AccountingFilters {
  period: AccountingPeriod
  customFrom?: string
  customTo?: string
  /** When set, only orders containing this product and line-level totals for it. */
  productId?: string | null
}

function orderHasProduct(order: Order, productId: string): boolean {
  return (order.items ?? []).some((item) => item.product_id === productId)
}

function getProductLineItems(order: Order, productId: string | null | undefined) {
  if (!productId) return order.items ?? []
  return (order.items ?? []).filter((item) => item.product_id === productId)
}

function productLineTotal(items: Order['items']): number {
  return (items ?? []).reduce((sum, item) => sum + Number(item.line_total), 0)
}

function productBoxCount(items: Order['items']): number {
  return (items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0)
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function getAccountingDateRange(filters: AccountingFilters): AccountingDateRange {
  const now = new Date()

  if (filters.period === 'all') {
    return { from: new Date(0), to: endOfDay(now) }
  }

  if (filters.period === 'custom') {
    const from = filters.customFrom
      ? startOfDay(new Date(filters.customFrom))
      : startOfDay(now)
    const to = filters.customTo
      ? endOfDay(new Date(filters.customTo))
      : endOfDay(now)
    return { from, to: to < from ? endOfDay(from) : to }
  }

  if (filters.period === 'today') {
    return { from: startOfDay(now), to: endOfDay(now) }
  }

  if (filters.period === 'week') {
    const from = startOfDay(now)
    from.setDate(from.getDate() - 6)
    return { from, to: endOfDay(now) }
  }

  const from = startOfDay(now)
  from.setDate(1)
  return { from, to: endOfDay(now) }
}

export function filterOrdersForAccounting(
  orders: Order[],
  filters: AccountingFilters,
): Order[] {
  const { from, to } = getAccountingDateRange(filters)

  return orders.filter((order) => {
    if (order.status !== 'completed') return false
    const created = new Date(order.created_at)
    if (created < from || created > to) return false
    if (filters.productId && !orderHasProduct(order, filters.productId)) {
      return false
    }
    return true
  })
}

export function summarizeAccounting(
  orders: Order[],
  options?: { productId?: string | null },
): AccountingSummary {
  const productId = options?.productId ?? null
  let amountReceived = 0
  let balancePending = 0

  const summary = orders.reduce<AccountingSummary>(
    (acc, order) => {
      const items = getProductLineItems(order, productId)
      if (productId && items.length === 0) return acc

      const boxes = productBoxCount(items)
      const product = productId
        ? productLineTotal(items)
        : getOrderProductTotal(order)
      const delivery = productId ? 0 : getOrderDeliveryCharge(order)
      const discount = productId ? 0 : getOrderDiscount(order)
      const grand = productId
        ? product
        : getOrderGrandTotal(order)
      const received = productId ? null : getOrderAmountReceived(order)

      acc.orderCount += 1
      acc.boxesSold += boxes
      acc.productSales += product
      acc.deliveryCharges += delivery
      acc.discountsGiven += discount
      acc.grandTotal += grand

      if (received != null) {
        amountReceived += received
        const balance = getOrderBalanceDue(order)
        if (balance != null) balancePending += balance
      } else if (!productId) {
        balancePending += grand
      }

      return acc
    },
    {
      orderCount: 0,
      boxesSold: 0,
      productSales: 0,
      deliveryCharges: 0,
      discountsGiven: 0,
      grandTotal: 0,
      amountReceived: 0,
      balancePending: 0,
    },
  )

  return { ...summary, amountReceived, balancePending }
}

function csvCell(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function exportAccountingCsv(orders: Order[]): string {
  const header = [
    'Date',
    'Customer',
    'Phone',
    'Boxes',
    'Product total (PKR)',
    'Delivery charge (PKR)',
    'Discount (PKR)',
    'Amount due (PKR)',
    'Amount received (PKR)',
    'Balance due (PKR)',
    'Source',
    'Status',
    'Admin notes',
  ]

  const rows = orders.map((order) => {
    const received = getOrderAmountReceived(order)
    const balance = received != null ? getOrderBalanceDue(order) : getOrderGrandTotal(order)
    return [
      new Date(order.created_at).toLocaleString('en-PK'),
      order.customer_name,
      order.phone,
      getOrderBoxCount(order),
      getOrderProductTotal(order),
      getOrderDeliveryCharge(order),
      getOrderDiscount(order),
      getOrderGrandTotal(order),
      received ?? '',
      balance ?? '',
      order.order_source,
      order.status,
      order.admin_notes ?? '',
    ]
      .map(csvCell)
      .join(',')
  })

  return [header.join(','), ...rows].join('\n')
}

export function downloadAccountingCsv(orders: Order[], filenameStem: string): void {
  const csv = exportAccountingCsv(orders)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenameStem}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
