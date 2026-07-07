import type { PromoCode } from '../types'

export const seedPromoCodes: PromoCode[] = [
  {
    id: 'seed-promo-welcome10',
    code: 'WELCOME10',
    discount_type: 'percent',
    discount_value: 10,
    is_active: true,
    min_order_amount: null,
    max_uses: null,
    used_count: 0,
    expires_at: null,
    description: '10% off for new customers',
    created_at: new Date().toISOString(),
  },
  {
    id: 'seed-promo-save500',
    code: 'SAVE500',
    discount_type: 'amount',
    discount_value: 500,
    is_active: true,
    min_order_amount: 3000,
    max_uses: null,
    used_count: 0,
    expires_at: null,
    description: '₨500 off orders over ₨3,000',
    created_at: new Date().toISOString(),
  },
]
