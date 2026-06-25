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
    return true
  })
}

export function summarizeAccounting(orders: Order[]): AccountingSummary {
  let amountReceived = 0
  let balancePending = 0

  const summary = orders.reduce<AccountingSummary>(
    (acc, order) => {
      const boxes = getOrderBoxCount(order)
      const product = getOrderProductTotal(order)
      const delivery = getOrderDeliveryCharge(order)
      const discount = getOrderDiscount(order)
      const grand = getOrderGrandTotal(order)
      const received = getOrderAmountReceived(order)

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
      } else {
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
