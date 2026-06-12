import { normalizePriceType } from '../config/pricing'
import { PREMIUM_CHAUNSA_DELIVERY_START } from '../config/preorder'
import { slugFromName } from './slugify'
import type { PriceType, Product } from '../types'

export function normalizeProductRow(row: Product): Product {
  const price_type: PriceType = normalizePriceType(row.price_type, row.price_max)
  let coming_soon = row.coming_soon === true
  let delivery_starts_at = row.delivery_starts_at ?? null

  const name = row.name.toLowerCase()
  const isPremiumChaunsa =
    name.includes('premium') && name.includes('chaunsa')

  if (isPremiumChaunsa) {
    coming_soon = true
    delivery_starts_at =
      row.delivery_starts_at ?? PREMIUM_CHAUNSA_DELIVERY_START
  } else if (row.coming_soon !== true) {
    coming_soon = false
    if (!row.delivery_starts_at) delivery_starts_at = null
  }

  const slug = row.slug?.trim() || slugFromName(row.name) || 'product'

  return {
    ...row,
    slug,
    price: Number(row.price),
    price_type,
    price_max:
      price_type === 'range' && row.price_max != null
        ? Number(row.price_max)
        : null,
    unit_min:
      row.unit_min != null && row.unit_min !== undefined
        ? Number(row.unit_min)
        : null,
    unit_max:
      row.unit_max != null && row.unit_max !== undefined
        ? Number(row.unit_max)
        : null,
    coming_soon,
    delivery_starts_at,
  }
}
