import { SITE, formatPricePKR } from '../config/site'
import {
  formatOrderPackCount,
  formatOrderPackSize,
  getInvoiceSequence,
} from './orderDisplay'
import { getOrderAmountReceived, getOrderBalanceDue, getOrderDeliveryCharge, getOrderDiscount, getOrderGrandTotal, getOrderProductTotal } from './orderPayment'
import type { Order } from '../types'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatInvoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function slugifyFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export type InvoiceContext = {
  allOrders: Order[]
}

export function buildOrderInvoiceHtml(
  order: Order,
  context: InvoiceContext,
): string {
  const invNo = getInvoiceSequence(order, context.allOrders)
  const isPreorder = order.order_type === 'preorder'
  const productTotal = getOrderProductTotal(order)
  const deliveryCharge = getOrderDeliveryCharge(order)
  const discount = getOrderDiscount(order)
  const grandTotal = getOrderGrandTotal(order)
  const received = getOrderAmountReceived(order)
  const balance = getOrderBalanceDue(order)
  const invoiceDate = formatInvoiceDate(order.created_at)

  const itemsHtml =
    order.items && order.items.length > 0
      ? order.items
          .map(
            (item) => `
        <tr>
          <td class="col-product">${escapeHtml(item.product_name)}</td>
          <td class="col-packs">${escapeHtml(formatOrderPackCount(item.quantity))}</td>
          <td class="col-size">${escapeHtml(formatOrderPackSize(item.unit))}</td>
          <td class="col-money">${escapeHtml(formatPricePKR(Number(item.unit_price)))}</td>
          <td class="col-money">${escapeHtml(formatPricePKR(Number(item.line_total)))}</td>
        </tr>`,
          )
          .join('')
      : `<tr><td colspan="5" class="muted">No line items recorded.</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(invNo)} — ${escapeHtml(SITE.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #14532d;
      background: #fff;
      margin: 0;
      padding: 2rem 1.5rem;
      line-height: 1.5;
      font-size: 14px;
    }
    .invoice { max-width: 720px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 2px solid #bbf7d0;
      margin-bottom: 1.5rem;
    }
    .brand h1 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      color: #14532d;
    }
    .brand p { margin: 0.15rem 0; color: #4b5563; font-size: 0.9rem; }
    .inv-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
    }
    .inv-meta h2 {
      margin: 0 0 0.65rem;
      font-size: 1.25rem;
      color: #166534;
      width: 100%;
      text-align: right;
    }
    .meta-list {
      margin: 0;
      display: grid;
      gap: 0.35rem;
      min-width: 15rem;
    }
    .meta-row {
      display: grid;
      grid-template-columns: 6.75rem 1fr;
      gap: 0.65rem;
      align-items: baseline;
      font-size: 0.9rem;
    }
    .meta-row dt {
      margin: 0;
      color: #6b7280;
      font-weight: 600;
      text-align: right;
    }
    .meta-row dd {
      margin: 0;
      color: #111827;
      font-weight: 700;
      text-align: left;
    }
    .badge {
      display: inline-block;
      margin-top: 0.5rem;
      align-self: flex-end;
      padding: 0.2rem 0.55rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-radius: 999px;
      background: ${isPreorder ? '#dbeafe' : '#ecfdf5'};
      color: ${isPreorder ? '#1e40af' : '#166534'};
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .panel h3 {
      margin: 0 0 0.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
    }
    .panel p { margin: 0.15rem 0; line-height: 1.55; }
    .panel .address-line {
      margin: 0 0 0.35rem;
      max-width: 32ch;
    }
    .panel .address-city {
      margin: 0;
      font-weight: 600;
      color: #14532d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
      table-layout: fixed;
    }
    th, td {
      padding: 0.65rem 0.6rem;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    th {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b7280;
      background: #f0fdf4;
      text-align: left;
    }
    th.col-packs, td.col-packs { width: 4.5rem; text-align: center; }
    th.col-size, td.col-size { width: 6.5rem; text-align: left; }
    th.col-money, td.col-money { width: 6.75rem; text-align: right; }
    th.col-packs { text-align: center; }
    th.col-money { text-align: right; }
    td.col-product { text-align: left; word-break: break-word; }
    td.col-packs, td.col-money { white-space: nowrap; }
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
    .totals {
      margin: 0;
      width: 17rem;
      max-width: 100%;
    }
    .totals-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 1.25rem;
      align-items: baseline;
      padding: 0.45rem 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-row dt {
      margin: 0;
      color: #4b5563;
      font-weight: 600;
      text-align: left;
    }
    .totals-row dd {
      margin: 0;
      font-weight: 700;
      text-align: right;
      min-width: 6.5rem;
      white-space: nowrap;
    }
    .totals-row.grand dt,
    .totals-row.grand dd {
      font-size: 1.05rem;
      color: #14532d;
    }
    .totals-row.grand {
      border-bottom: none;
      padding-top: 0.5rem;
    }
    .totals-row.grand.balance dt,
    .totals-row.grand.balance dd {
      font-size: 1.1rem;
    }
    .notes {
      margin-top: 1.25rem;
      padding: 0.85rem 1rem;
      background: #f9fafb;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #4b5563;
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px dashed #d1d5db;
      font-size: 0.8rem;
      color: #6b7280;
      text-align: center;
    }
    .muted { color: #9ca3af; }
    @media print {
      body { padding: 0.5in; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <header class="header">
      <div class="brand">
        <h1>${escapeHtml(SITE.name)}</h1>
        <p>${escapeHtml(SITE.tagline)}</p>
        <p>Phone: ${escapeHtml(SITE.phone)}</p>
      </div>
      <div class="inv-meta">
        <h2>INVOICE</h2>
        <dl class="meta-list">
          <div class="meta-row">
            <dt>Invoice no.</dt>
            <dd>${escapeHtml(invNo)}</dd>
          </div>
          <div class="meta-row">
            <dt>Date</dt>
            <dd>${escapeHtml(invoiceDate)}</dd>
          </div>
          <div class="meta-row">
            <dt>Status</dt>
            <dd>${escapeHtml(order.status)}</dd>
          </div>
        </dl>
        <span class="badge">${isPreorder ? 'Pre-order' : 'Order'}</span>
      </div>
    </header>

    <div class="grid">
      <div class="panel">
        <h3>Bill to</h3>
        <p><strong>${escapeHtml(order.customer_name)}</strong></p>
        <p>Phone: ${escapeHtml(order.phone)}</p>
        ${order.email ? `<p>Email: ${escapeHtml(order.email)}</p>` : ''}
      </div>
      <div class="panel">
        <h3>Deliver to</h3>
        <p class="address-line">${escapeHtml(order.address_line)}</p>
        <p class="address-city">${escapeHtml(order.city)}, ${escapeHtml(SITE.deliveryArea)}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="col-product">Product</th>
          <th class="col-packs">Boxes</th>
          <th class="col-size">Box size</th>
          <th class="col-money">Price / box</th>
          <th class="col-money">Line total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="totals-wrap">
      <dl class="totals">
        <div class="totals-row">
          <dt>Product total</dt>
          <dd>${escapeHtml(formatPricePKR(productTotal))}</dd>
        </div>
        ${
          deliveryCharge > 0
            ? `<div class="totals-row"><dt>Delivery charge</dt><dd>${escapeHtml(formatPricePKR(deliveryCharge))}</dd></div>`
            : ''
        }
        ${
          discount > 0
            ? `<div class="totals-row"><dt>${order.promo_code ? `Promo (${escapeHtml(order.promo_code)})` : 'Discount'}</dt><dd>−${escapeHtml(formatPricePKR(discount))}</dd></div>`
            : ''
        }
        <div class="totals-row grand">
          <dt>Amount due</dt>
          <dd>${escapeHtml(formatPricePKR(grandTotal))}</dd>
        </div>
        ${
          received != null
            ? `<div class="totals-row"><dt>Amount received</dt><dd>${escapeHtml(formatPricePKR(received))}</dd></div>
        <div class="totals-row grand balance"><dt>Balance due</dt><dd>${escapeHtml(formatPricePKR(balance!))}</dd></div>`
            : ''
        }
      </dl>
    </div>

    ${
      order.admin_notes
        ? `<div class="notes"><strong>Accounting note:</strong> ${escapeHtml(order.admin_notes)}</div>`
        : ''
    }

    ${
      order.notes
        ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(order.notes)}</div>`
        : ''
    }

    <p class="footer">
      Thank you for choosing ${escapeHtml(SITE.name)}. Questions? WhatsApp ${escapeHtml(SITE.whatsappDisplay)}.
    </p>
  </div>
</body>
</html>`
}

function openInvoiceWindow(order: Order, context: InvoiceContext) {
  const html = buildOrderInvoiceHtml(order, context)
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) {
    throw new Error('Pop-up blocked. Allow pop-ups to open the invoice.')
  }
  win.document.write(html)
  win.document.close()
  win.focus()
}

export function downloadOrderInvoiceHtml(
  order: Order,
  context: InvoiceContext,
): void {
  const html = buildOrderInvoiceHtml(order, context)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const seq = getInvoiceSequence(order, context.allOrders)
  link.href = url
  link.download = `invoice-${seq}-${slugifyFilename(order.customer_name)}.html`
  link.click()
  URL.revokeObjectURL(url)
}

export function viewOrderInvoice(order: Order, context: InvoiceContext): void {
  openInvoiceWindow(order, context)
}

/** @deprecated Use downloadOrderInvoiceHtml */
export const downloadOrderInvoice = downloadOrderInvoiceHtml
