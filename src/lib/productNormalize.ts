import { normalizeProductImages } from '../config/productImages'
import { normalizePackagingRow, sortPackagings } from '../config/packaging'
import { normalizePriceType } from '../config/pricing'
import { normalizeSoldOutMode, PREMIUM_CHAUNSA_DELIVERY_START } from '../config/preorder'
import { slugFromName } from './slugify'
import type {
  PriceType,
  Product,
  ProductImage,
  ProductPackaging,
} from '../types'

export function normalizeProductRow(row: Product): Product {
  const price_type: PriceType = normalizePriceType(row.price_type, row.price_max)
  const hasExplicitComingSoon = typeof row.coming_soon === 'boolean'
  let coming_soon = row.coming_soon === true
  let delivery_starts_at = row.delivery_starts_at ?? null

  const name = row.name.toLowerCase()
  const isPremiumChaunsa =
    name.includes('premium') && name.includes('chaunsa')

  // Keep legacy default only when old rows do not carry an explicit coming_soon value.
  if (isPremiumChaunsa && !hasExplicitComingSoon) {
    coming_soon = true
    delivery_starts_at =
      row.delivery_starts_at ?? PREMIUM_CHAUNSA_DELIVERY_START
  } else if (!coming_soon) {
    coming_soon = false
    if (!row.delivery_starts_at) delivery_starts_at = null
  }

  const slug = row.slug?.trim() || slugFromName(row.name) || 'product'

  const packagings = normalizeProductPackagings(row.packagings)
  const images = normalizeProductImages(row.images)
  const primaryImage = images[0]?.image_url ?? row.image_url ?? null

  return {
    ...row,
    packagings,
    images,
    image_url: primaryImage,
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
    sold_out_mode: normalizeSoldOutMode(row.sold_out_mode),
  }
}

export function normalizeProductPackagings(
  raw: ProductPackaging[] | undefined | null,
): ProductPackaging[] {
  if (!raw?.length) return []
  return sortPackagings(raw.map(normalizePackagingRow))
}

export function normalizeProductImagesFromRows(
  raw: ProductImage[] | undefined | null,
): ProductImage[] {
  return normalizeProductImages(raw)
}
