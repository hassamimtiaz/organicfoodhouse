import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { SITE } from '../config/site'
import {
  formatOrderPackCount,
  formatOrderPackSize,
  getInvoiceSequence,
} from './orderDisplay'
import type { InvoiceContext } from './invoice'
import { getOrderAmountReceived, getOrderBalanceDue, getOrderDeliveryCharge, getOrderDiscount, getOrderGrandTotal, getOrderProductTotal } from './orderPayment'
import type { Order } from '../types'

const GREEN: [number, number, number] = [20, 83, 45]
const MUTED: [number, number, number] = [75, 85, 99]
const TEXT: [number, number, number] = [17, 24, 39]

/** jsPDF standard fonts do not render ₨ — use ASCII "Rs" */
function formatPricePdf(amount: number): string {
  const n = Math.round(Number(amount))
  return `Rs ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
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

function drawMetaRow(
  doc: jsPDF,
  labelColEnd: number,
  valueX: number,
  y: number,
  label: string,
  value: string,
) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(`${label}:`, labelColEnd, y, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...TEXT)
  doc.text(value, valueX, y)
}

function drawTotalsRow(
  doc: jsPDF,
  labelRight: number,
  valueRight: number,
  y: number,
  label: string,
  value: string,
  large = false,
) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(large ? 11 : 9)
  if (large) doc.setTextColor(...TEXT)
  else doc.setTextColor(...MUTED)
  doc.text(label, labelRight, y, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(large ? 11 : 10)
  doc.setTextColor(...TEXT)
  doc.text(value, valueRight, y, { align: 'right' })
}

export function downloadOrderInvoicePdf(
  order: Order,
  context: InvoiceContext,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const invNo = getInvoiceSequence(order, context.allOrders)
  const invoiceDate = formatInvoiceDate(order.created_at)
  const isPreorder = order.order_type === 'preorder'
  const productTotal = getOrderProductTotal(order)
  const deliveryCharge = getOrderDeliveryCharge(order)
  const discount = getOrderDiscount(order)
  const grandTotal = getOrderGrandTotal(order)
  const received = getOrderAmountReceived(order)
  const balance = getOrderBalanceDue(order)

  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...GREEN)
  doc.text(SITE.name, margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  y += 7
  doc.text(SITE.tagline, margin, y)
  y += 5
  doc.text(`Phone: ${SITE.phone}`, margin, y)

  const metaBoxLeft = pageWidth - margin - 62
  const metaLabelEnd = metaBoxLeft + 26
  const metaValueX = metaBoxLeft + 28

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...GREEN)
  doc.text('INVOICE', pageWidth - margin, 18, { align: 'right' })

  let metaY = 26
  drawMetaRow(doc, metaLabelEnd, metaValueX, metaY, 'Invoice no.', invNo)
  metaY += 5.5
  drawMetaRow(doc, metaLabelEnd, metaValueX, metaY, 'Date', invoiceDate)
  metaY += 5.5
  drawMetaRow(doc, metaLabelEnd, metaValueX, metaY, 'Status', order.status)
  metaY += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  if (isPreorder) doc.setTextColor(30, 64, 175)
  else doc.setTextColor(...GREEN)
  doc.text(isPreorder ? 'Pre-order' : 'Order', metaValueX, metaY)

  y = Math.max(y, metaY) + 8
  doc.setDrawColor(187, 247, 208)
  doc.setLineWidth(0.6)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  const colMid = pageWidth / 2 + 2
  const deliverWidth = pageWidth - colMid - margin
  const sectionStartY = y

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('BILL TO', margin, sectionStartY)
  doc.text('DELIVER TO', colMid, sectionStartY)

  let leftY = sectionStartY + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT)
  doc.text(order.customer_name, margin, leftY)
  leftY += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Phone: ${order.phone}`, margin, leftY)
  if (order.email) {
    leftY += 4.5
    doc.text(`Email: ${order.email}`, margin, leftY)
  }

  let deliverY = sectionStartY + 5
  const addressLines = doc.splitTextToSize(order.address_line, deliverWidth)
  doc.setFont('helvetica', 'normal')
  doc.text(addressLines, colMid, deliverY)
  deliverY += addressLines.length * 4.5 + 1
  doc.setFont('helvetica', 'bold')
  doc.text(`${order.city}, ${SITE.deliveryArea}`, colMid, deliverY)

  y = Math.max(leftY, deliverY) + 10

  const tableBody =
    order.items && order.items.length > 0
      ? order.items.map((item) => [
          item.product_name,
          formatOrderPackCount(item.quantity),
          formatOrderPackSize(item.unit),
          formatPricePdf(Number(item.unit_price)),
          formatPricePdf(Number(item.line_total)),
        ])
      : [['—', '—', '—', '—', 'No items']]

  autoTable(doc, {
    startY: y,
    head: [['Product', 'Boxes', 'Box size', 'Price / box', 'Total']],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: TEXT,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [240, 253, 244],
      textColor: GREEN,
      fontStyle: 'bold',
      fontSize: 8,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 24, halign: 'left' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell(data) {
      if (data.section !== 'head') return
      if (data.column.index === 1) data.cell.styles.halign = 'center'
      if (data.column.index >= 3) data.cell.styles.halign = 'right'
    },
  })

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 40

  const totalsRight = pageWidth - margin
  const totalsLabelRight = totalsRight - 38
  let totalsY = finalY + 10

  drawTotalsRow(
    doc,
    totalsLabelRight,
    totalsRight,
    totalsY,
    'Product total',
    formatPricePdf(productTotal),
  )
  totalsY += 7
  if (deliveryCharge > 0) {
    drawTotalsRow(
      doc,
      totalsLabelRight,
      totalsRight,
      totalsY,
      'Delivery charge',
      formatPricePdf(deliveryCharge),
    )
    totalsY += 7
  }
  if (discount > 0) {
    drawTotalsRow(
      doc,
      totalsLabelRight,
      totalsRight,
      totalsY,
      'Discount',
      `-${formatPricePdf(discount)}`,
    )
    totalsY += 7
  }
  drawTotalsRow(
    doc,
    totalsLabelRight,
    totalsRight,
    totalsY,
    'Amount due',
    formatPricePdf(grandTotal),
    true,
  )
  totalsY += 7
  if (received != null) {
    drawTotalsRow(
      doc,
      totalsLabelRight,
      totalsRight,
      totalsY,
      'Amount received',
      formatPricePdf(received),
    )
    totalsY += 7
    drawTotalsRow(
      doc,
      totalsLabelRight,
      totalsRight,
      totalsY,
      'Balance due',
      formatPricePdf(balance!),
      true,
    )
    totalsY += 7
  }

  if (order.admin_notes) {
    totalsY += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    doc.text('Accounting note:', margin, totalsY)
    totalsY += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    const adminLines = doc.splitTextToSize(order.admin_notes, pageWidth - margin * 2)
    doc.text(adminLines, margin, totalsY)
    totalsY += adminLines.length * 4.5
  }

  if (order.notes) {
    totalsY += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT)
    doc.text('Notes:', margin, totalsY)
    totalsY += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    const noteLines = doc.splitTextToSize(order.notes, pageWidth - margin * 2)
    doc.text(noteLines, margin, totalsY)
    totalsY += noteLines.length * 4.5
  }

  const footerY = Math.min(totalsY + 12, doc.internal.pageSize.getHeight() - 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(
    `Thank you for choosing ${SITE.name}. WhatsApp: ${SITE.whatsappDisplay}`,
    pageWidth / 2,
    footerY,
    { align: 'center' },
  )

  const seq = getInvoiceSequence(order, context.allOrders)
  doc.save(`invoice-${seq}-${slugifyFilename(order.customer_name)}.pdf`)
}
