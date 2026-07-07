import { formatPricePKR } from '../config/site'
import type { PromoCode } from '../types'

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase()
}

export function calculatePromoDiscount(
  promo: Pick<PromoCode, 'discount_type' | 'discount_value'>,
  subtotal: number,
): number {
  if (subtotal <= 0) return 0

  const discount =
    promo.discount_type === 'percent'
      ? Math.round((subtotal * promo.discount_value) / 100)
      : Math.min(promo.discount_value, subtotal)

  return Math.max(0, Math.min(discount, subtotal))
}

export function getPromoValidationError(
  promo: PromoCode,
  subtotal: number,
): string | null {
  if (!promo.is_active) {
    return 'This promo code is no longer active.'
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return 'This promo code has expired.'
  }
  if (promo.max_uses != null && promo.used_count >= promo.max_uses) {
    return 'This promo code has reached its usage limit.'
  }
  if (
    promo.min_order_amount != null &&
    subtotal < promo.min_order_amount
  ) {
    return `Minimum order amount is ${formatPricePKR(promo.min_order_amount)}.`
  }
  return null
}

export function formatPromoDiscountLabel(promo: Pick<PromoCode, 'discount_type' | 'discount_value'>): string {
  if (promo.discount_type === 'percent') {
    return `${promo.discount_value}% off`
  }
  return `${formatPricePKR(promo.discount_value)} off`
}
