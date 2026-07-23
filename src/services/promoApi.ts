import { seedPromoCodes } from '../data/seedPromoCodes'
import {
  calculatePromoDiscount,
  getPromoValidationError,
  normalizePromoCode,
} from '../lib/promoCode'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { supabaseErrorMessage } from '../lib/supabaseErrors'
import { isPromoCodesEnabled } from './siteSettingsApi'
import type {
  AppliedPromo,
  PromoCode,
  PromoCodeFormData,
  PromoDiscountType,
} from '../types'

function normalizePromoRow(row: PromoCode): PromoCode {
  return {
    ...row,
    discount_value: Number(row.discount_value),
    min_order_amount:
      row.min_order_amount != null ? Number(row.min_order_amount) : null,
    max_uses: row.max_uses != null ? Number(row.max_uses) : null,
    used_count: Number(row.used_count),
  }
}

function validatePromoForm(form: PromoCodeFormData): void {
  const code = normalizePromoCode(form.code)
  if (!code) {
    throw new Error('Enter a promo code.')
  }
  if (form.discount_value <= 0) {
    throw new Error('Discount value must be greater than zero.')
  }
  if (form.discount_type === 'percent' && form.discount_value > 100) {
    throw new Error('Percentage discount cannot exceed 100%.')
  }
  if (form.min_order_amount != null && form.min_order_amount < 0) {
    throw new Error('Minimum order amount cannot be negative.')
  }
  if (form.max_uses != null && form.max_uses <= 0) {
    throw new Error('Max uses must be greater than zero.')
  }
}

function promoFormPayload(form: PromoCodeFormData) {
  validatePromoForm(form)
  return {
    code: normalizePromoCode(form.code),
    discount_type: form.discount_type as PromoDiscountType,
    discount_value: form.discount_value,
    is_active: form.is_active,
    min_order_amount:
      form.min_order_amount != null && form.min_order_amount > 0
        ? Math.round(form.min_order_amount)
        : null,
    max_uses:
      form.max_uses != null && form.max_uses > 0
        ? Math.round(form.max_uses)
        : null,
    expires_at: form.expires_at.trim()
      ? new Date(form.expires_at).toISOString()
      : null,
    description: form.description.trim() || null,
  }
}

function findSeedPromo(code: string): PromoCode | undefined {
  const normalized = normalizePromoCode(code)
  return seedPromoCodes.find((promo) => normalizePromoCode(promo.code) === normalized)
}

function validateSeedPromo(code: string, subtotal: number): AppliedPromo {
  const promo = findSeedPromo(code)
  if (!promo) {
    throw new Error('Invalid promo code.')
  }

  const validationError = getPromoValidationError(promo, subtotal)
  if (validationError) {
    throw new Error(validationError)
  }

  const discountAmount = calculatePromoDiscount(promo, subtotal)
  if (discountAmount <= 0) {
    throw new Error('This promo code does not apply to your order.')
  }

  return {
    id: promo.id,
    code: promo.code,
    discountAmount,
  }
}

export async function validatePromoCode(
  code: string,
  subtotal: number,
): Promise<AppliedPromo> {
  if (!(await isPromoCodesEnabled())) {
    throw new Error('Promo codes are not available right now.')
  }

  const trimmed = code.trim()
  if (!trimmed) {
    throw new Error('Enter a promo code.')
  }
  if (subtotal <= 0) {
    throw new Error('Add items to your order before applying a promo code.')
  }

  if (!isSupabaseConfigured || !supabase) {
    return validateSeedPromo(trimmed, subtotal)
  }

  const { data, error } = await supabase.rpc('validate_promo_code', {
    p_code: trimmed,
    p_subtotal: subtotal,
  })

  if (error) {
    throw new Error(supabaseErrorMessage(error))
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.promo_id || !row.code || row.discount_amount == null) {
    throw new Error('Invalid promo code.')
  }

  const discountAmount = Number(row.discount_amount)
  if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
    throw new Error('This promo code does not apply to your order.')
  }

  return {
    id: String(row.promo_id),
    code: String(row.code),
    discountAmount: Math.round(discountAmount),
  }
}

export async function incrementPromoUsage(promoId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const promo = seedPromoCodes.find((row) => row.id === promoId)
    if (promo) {
      promo.used_count += 1
    }
    return
  }

  const { error } = await supabase.rpc('increment_promo_usage', {
    p_promo_id: promoId,
  })

  if (error) {
    throw new Error(supabaseErrorMessage(error))
  }
}

export async function fetchAllPromoCodes(): Promise<PromoCode[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [...seedPromoCodes]
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(supabaseErrorMessage(error))
  return (data ?? []).map((row) => normalizePromoRow(row as PromoCode))
}

export async function createPromoCode(form: PromoCodeFormData): Promise<void> {
  const payload = promoFormPayload(form)

  if (!isSupabaseConfigured || !supabase) {
    if (seedPromoCodes.some((promo) => normalizePromoCode(promo.code) === payload.code)) {
      throw new Error('A promo code with this name already exists.')
    }
    seedPromoCodes.unshift({
      id: `seed-promo-${crypto.randomUUID()}`,
      ...payload,
      used_count: 0,
      created_at: new Date().toISOString(),
    })
    return
  }

  const { error } = await supabase.from('promo_codes').insert(payload)
  if (error) throw new Error(supabaseErrorMessage(error))
}

export async function updatePromoCode(
  id: string,
  form: PromoCodeFormData,
): Promise<void> {
  const payload = promoFormPayload(form)

  if (!isSupabaseConfigured || !supabase) {
    const index = seedPromoCodes.findIndex((promo) => promo.id === id)
    if (index < 0) throw new Error('Promo code not found.')
    const duplicate = seedPromoCodes.some(
      (promo) =>
        promo.id !== id && normalizePromoCode(promo.code) === payload.code,
    )
    if (duplicate) {
      throw new Error('A promo code with this name already exists.')
    }
    seedPromoCodes[index] = {
      ...seedPromoCodes[index],
      ...payload,
    }
    return
  }

  const { error } = await supabase.from('promo_codes').update(payload).eq('id', id)
  if (error) throw new Error(supabaseErrorMessage(error))
}

export async function deletePromoCode(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const index = seedPromoCodes.findIndex((promo) => promo.id === id)
    if (index >= 0) seedPromoCodes.splice(index, 1)
    return
  }

  const { error } = await supabase.from('promo_codes').delete().eq('id', id)
  if (error) throw new Error(supabaseErrorMessage(error))
}

export async function setPromoCodeActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const promo = seedPromoCodes.find((row) => row.id === id)
    if (promo) promo.is_active = isActive
    return
  }

  const { error } = await supabase
    .from('promo_codes')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw new Error(supabaseErrorMessage(error))
}
