import type { OrderExtraCharge, OrderExtraChargeKind } from '../types'

const CHARGE_KINDS = new Set<OrderExtraChargeKind>(['charge', 'discount'])

export const INVOICE_LINE_PRESETS: Array<{
  label: string
  kind: OrderExtraChargeKind
}> = [
  { label: 'Delivery Charges', kind: 'charge' },
  { label: 'Discount', kind: 'discount' },
  { label: 'Gift Card Printing', kind: 'charge' },
  { label: 'Packing', kind: 'charge' },
  { label: 'COD Fee', kind: 'charge' },
]

export function normalizeExtraCharges(value: unknown): OrderExtraCharge[] {
  if (!Array.isArray(value)) return []

  const charges: OrderExtraCharge[] = []
  for (const row of value) {
    if (!row || typeof row !== 'object') continue
    const label =
      typeof (row as { label?: unknown }).label === 'string'
        ? (row as { label: string }).label.trim()
        : ''
    const amount = Number((row as { amount?: unknown }).amount)
    const rawKind = (row as { kind?: unknown }).kind
    const kind: OrderExtraChargeKind =
      typeof rawKind === 'string' && CHARGE_KINDS.has(rawKind as OrderExtraChargeKind)
        ? (rawKind as OrderExtraChargeKind)
        : 'charge'
    if (!label || !Number.isFinite(amount) || amount <= 0) continue
    charges.push({ label, amount: Math.round(amount), kind })
  }
  return charges
}

/** Net effect of invoice lines: charges add, discounts subtract. */
export function getExtraChargesTotal(
  charges: OrderExtraCharge[] | null | undefined,
): number {
  if (!charges?.length) return 0
  return charges.reduce((sum, charge) => {
    const amount = Number(charge.amount)
    if (!Number.isFinite(amount) || amount <= 0) return sum
    return charge.kind === 'discount' ? sum - amount : sum + amount
  }, 0)
}

export function getExtraChargeLinesTotal(
  charges: OrderExtraCharge[] | null | undefined,
  kind: OrderExtraChargeKind,
): number {
  if (!charges?.length) return 0
  return charges
    .filter((charge) => charge.kind === kind)
    .reduce((sum, charge) => sum + Number(charge.amount), 0)
}

export function sanitizeExtraChargesInput(
  charges: Array<{
    label: string
    amount: string | number | null
    kind?: OrderExtraChargeKind | string
  }>,
): OrderExtraCharge[] {
  return normalizeExtraCharges(
    charges.map((charge) => ({
      label: charge.label,
      kind: charge.kind === 'discount' ? 'discount' : 'charge',
      amount:
        typeof charge.amount === 'string'
          ? charge.amount.trim() === ''
            ? 0
            : Number(charge.amount)
          : Number(charge.amount),
    })),
  )
}

/** Build editable lines from stored extras + legacy delivery/discount columns. */
export function invoiceLinesFromOrder(order: {
  delivery_charge: number | null
  discount: number | null
  promo_code?: string | null
  extra_charges?: OrderExtraCharge[] | null
}): OrderExtraCharge[] {
  const lines = normalizeExtraCharges(order.extra_charges)
  if (lines.length > 0) return lines

  const legacy: OrderExtraCharge[] = []
  if (order.delivery_charge != null && order.delivery_charge > 0) {
    legacy.push({
      label: 'Delivery Charges',
      amount: Math.round(Number(order.delivery_charge)),
      kind: 'charge',
    })
  }
  if (order.discount != null && order.discount > 0) {
    legacy.push({
      label: order.promo_code ? `Promo (${order.promo_code})` : 'Discount',
      amount: Math.round(Number(order.discount)),
      kind: 'discount',
    })
  }
  return legacy
}

/** Derive legacy columns from invoice lines for accounting compatibility. */
export function deriveLegacyChargesFromLines(lines: OrderExtraCharge[]): {
  delivery_charge: number | null
  discount: number | null
  extra_charges: OrderExtraCharge[]
} {
  const normalized = normalizeExtraCharges(lines)
  const delivery = normalized.find(
    (line) =>
      line.kind === 'charge' && /^delivery(\s+charges?)?$/i.test(line.label),
  )
  const discountTotal = getExtraChargeLinesTotal(normalized, 'discount')

  return {
    delivery_charge: delivery ? delivery.amount : null,
    discount: discountTotal > 0 ? discountTotal : null,
    extra_charges: normalized,
  }
}
