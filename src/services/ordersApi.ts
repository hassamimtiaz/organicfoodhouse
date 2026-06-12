import { seedOrderItems, seedOrders } from '../data/seedOrders'
import { seedCategories, seedProducts } from '../data/seed'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  normalizeOrderItemRow,
  normalizeOrderRow,
} from '../lib/orderNormalize'
import { getOrderLineTotal, getOrderUnitPrice } from '../config/pricing'
import { formatUnitLabel } from '../config/units'
import { isComingSoonProduct } from '../config/preorder'
import { clampPackQuantity } from '../lib/cartStorage'
import { normalizeProductRow } from '../lib/productNormalize'
import {
  isMissingColumnError,
  supabaseErrorMessage,
} from '../lib/supabaseErrors'
import type {
  CheckoutFormData,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PlaceOrderFormData,
  Product,
} from '../types'

export async function fetchProductBySlugOrId(
  ref: string,
): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) {
    return (
      seedProducts.find((p) => p.slug === ref) ??
      seedProducts.find((p) => p.id === ref) ??
      null
    )
  }

  const { data: bySlug, error: slugError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', ref)
    .maybeSingle()

  if (slugError && !isMissingColumnError(slugError, ['slug'])) {
    throw slugError
  }
  if (bySlug) return normalizeProductRow(bySlug as Product)

  const { data: byId, error: idError } = await supabase
    .from('products')
    .select('*')
    .eq('id', ref)
    .maybeSingle()

  if (idError) throw idError
  if (!byId) return null
  return normalizeProductRow(byId as Product)
}

/** @deprecated Use fetchProductBySlugOrId */
export async function fetchProductById(id: string): Promise<Product | null> {
  return fetchProductBySlugOrId(id)
}

export async function getProductCategoryPath(
  product: Product,
): Promise<{ parentSlug: string; subSlug: string } | null> {
  if (!isSupabaseConfigured || !supabase) {
    const sub = seedCategories.find((c) => c.id === product.category_id)
    if (!sub?.parent_id) return null
    const parent = seedCategories.find((c) => c.id === sub.parent_id)
    if (!parent) return null
    return { parentSlug: parent.slug, subSlug: sub.slug }
  }

  const { data: subCat, error: subError } = await supabase
    .from('categories')
    .select('slug, parent_id')
    .eq('id', product.category_id)
    .maybeSingle()

  if (subError) throw subError
  if (!subCat?.parent_id) return null

  const { data: parent, error: parentError } = await supabase
    .from('categories')
    .select('slug')
    .eq('id', subCat.parent_id)
    .maybeSingle()

  if (parentError) throw parentError
  if (!parent) return null

  return { parentSlug: parent.slug, subSlug: subCat.slug }
}

function buildOrderInsert(
  form: CheckoutFormData,
  total: number,
  orderType: OrderType,
) {
  return {
    customer_name: form.customer_name,
    phone: form.phone,
    email: form.email || null,
    address_line: form.address_line,
    city: form.city,
    notes: form.notes || null,
    status: 'pending' as const,
    total,
    order_type: orderType,
    advance_payment: null,
  }
}

export async function placeCartOrder(
  lines: { product: Product; quantity: number }[],
  form: CheckoutFormData,
): Promise<Order> {
  if (lines.length === 0) {
    throw new Error('Your cart is empty.')
  }

  const prepared = lines.map(({ product, quantity }) => {
    const qty = clampPackQuantity(quantity)
    const unitPrice = getOrderUnitPrice(product)
    const lineTotal = getOrderLineTotal(product, qty)
    const unitLabel = formatUnitLabel(product)
    return { product, quantity: qty, unitPrice, lineTotal, unitLabel }
  })

  const total = prepared.reduce((sum, line) => sum + line.lineTotal, 0)
  const orderType: OrderType = prepared.some((line) =>
    isComingSoonProduct(line.product),
  )
    ? 'preorder'
    : 'order'

  if (!isSupabaseConfigured || !supabase) {
    const orderId = `local-order-${crypto.randomUUID()}`
    const order: Order = {
      id: orderId,
      customer_name: form.customer_name,
      phone: form.phone,
      email: form.email || null,
      address_line: form.address_line,
      city: form.city,
      notes: form.notes || null,
      status: 'pending',
      order_type: orderType,
      advance_payment: null,
      total,
      created_at: new Date().toISOString(),
    }
    const items: OrderItem[] = prepared.map((line) => ({
      id: `local-item-${crypto.randomUUID()}`,
      order_id: orderId,
      product_id: line.product.id,
      product_name: line.product.name,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      unit: line.unitLabel,
      line_total: line.lineTotal,
    }))
    seedOrders.unshift(order)
    seedOrderItems.push(...items)
    return { ...order, items }
  }

  const fullPayload = buildOrderInsert(form, total, orderType)
  const legacyPayload = {
    customer_name: form.customer_name,
    phone: form.phone,
    email: form.email || null,
    address_line: form.address_line,
    city: form.city,
    notes: form.notes || null,
    status: 'pending' as const,
    total,
  }

  const orderId = crypto.randomUUID()
  let insertedPayload: (typeof fullPayload | typeof legacyPayload) | null =
    null
  let lastError: unknown = null

  for (const payload of [fullPayload, legacyPayload]) {
    const { error } = await supabase.from('orders').insert({
      id: orderId,
      ...payload,
    })

    if (!error) {
      insertedPayload = payload
      break
    }

    lastError = error
    if (!isMissingColumnError(error, ['order_type', 'advance_payment'])) {
      throw new Error(supabaseErrorMessage(error))
    }
  }

  if (!insertedPayload) {
    throw new Error(supabaseErrorMessage(lastError))
  }

  const { error: itemsError } = await supabase.from('order_items').insert(
    prepared.map((line) => ({
      order_id: orderId,
      product_id: line.product.id,
      product_name: line.product.name,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      unit: line.unitLabel,
      line_total: line.lineTotal,
    })),
  )

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', orderId)
    throw new Error(supabaseErrorMessage(itemsError))
  }

  const order = normalizeOrderRow({
    id: orderId,
    ...insertedPayload,
    created_at: new Date().toISOString(),
  } as Order)

  return order
}

export async function placeOrder(
  product: Product,
  form: PlaceOrderFormData,
  options?: { isPreorder?: boolean },
): Promise<Order> {
  void options?.isPreorder
  const quantity = clampPackQuantity(form.quantity)
  const { quantity: _qty, ...checkout } = form
  return placeCartOrder([{ product, quantity }], checkout)
}

export async function fetchAllOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) {
    return seedOrders.map((o) => ({
      ...normalizeOrderRow(o),
      items: seedOrderItems
        .filter((i) => i.order_id === o.id)
        .map(normalizeOrderItemRow),
    }))
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!orders?.length) return []

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in(
      'order_id',
      orders.map((o) => o.id),
    )

  if (itemsError) throw itemsError

  return orders.map((o) => {
    const normalized = normalizeOrderRow(o as Order)
    return {
      ...normalized,
      items:
        items
          ?.filter((i) => i.order_id === o.id)
          .map((i) => normalizeOrderItemRow(i as OrderItem)) ?? [],
    }
  })
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const order = seedOrders.find((o) => o.id === orderId)
    if (order) order.status = status
    return
  }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error
}

export async function updateOrderAdvancePayment(
  orderId: string,
  amount: number | null,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const order = seedOrders.find((o) => o.id === orderId)
    if (order) order.advance_payment = amount
    return
  }

  const { error } = await supabase
    .from('orders')
    .update({ advance_payment: amount })
    .eq('id', orderId)

  if (error) {
    if (isMissingColumnError(error, ['advance_payment'])) {
      throw new Error(
        'Advance payment is not enabled yet. Run migration 010_orders_preorder_advance.sql in Supabase.',
      )
    }
    throw error
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const index = seedOrders.findIndex((o) => o.id === orderId)
    if (index >= 0) seedOrders.splice(index, 1)
    for (let i = seedOrderItems.length - 1; i >= 0; i--) {
      if (seedOrderItems[i].order_id === orderId) seedOrderItems.splice(i, 1)
    }
    return
  }

  const { error } = await supabase.from('orders').delete().eq('id', orderId)

  if (error) throw error
}
