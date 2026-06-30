import { seedOrderItems, seedOrders } from '../data/seedOrders'
import { seedCategories, seedProducts } from '../data/seed'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  normalizeOrderItemRow,
  normalizeOrderRow,
} from '../lib/orderNormalize'
import { getOrderLineTotal, getOrderUnitLabel, getOrderUnitPrice } from '../config/pricing'
import { hasPackagings } from '../config/packaging'
import {
  decrementPackagingStockForLines,
  validateCartPackagingStock,
} from '../lib/packagingStock'
import { isPreorderOrder } from '../config/preorder'
import { clampPackQuantity } from '../lib/cartStorage'
import { normalizeProductRow } from '../lib/productNormalize'
import { attachImagesToProduct } from '../lib/productImages'
import { attachPackagingsToProduct } from '../lib/productPackagings'
import {
  isMissingColumnError,
  supabaseErrorMessage,
} from '../lib/supabaseErrors'
import type {
  CheckoutFormData,
  ManualOrderFormData,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PlaceOrderFormData,
  Product,
  CartLine,
} from '../types'

export async function fetchProductBySlugOrId(
  ref: string,
  options: { includeGallery?: boolean } = {},
): Promise<Product | null> {
  const { includeGallery = false } = options
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
  if (bySlug) {
    const product = normalizeProductRow(bySlug as Product)
    const withPackagings = await attachPackagingsToProduct(product)
    return includeGallery
      ? attachImagesToProduct(withPackagings)
      : withPackagings
  }

  const { data: byId, error: idError } = await supabase
    .from('products')
    .select('*')
    .eq('id', ref)
    .maybeSingle()

  if (idError) throw idError
  if (!byId) return null
  const product = normalizeProductRow(byId as Product)
  const withPackagings = await attachPackagingsToProduct(product)
  return includeGallery ? attachImagesToProduct(withPackagings) : withPackagings
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
  lines: CartLine[],
  form: CheckoutFormData,
): Promise<Order> {
  if (lines.length === 0) {
    throw new Error('Your cart is empty.')
  }

  const prepared = lines.map(({ product, quantity, packaging_id }) => {
    if (hasPackagings(product) && !packaging_id) {
      throw new Error(`Select a ox option for ${product.name}.`)
    }
    const qty = clampPackQuantity(quantity)
    const unitPrice = getOrderUnitPrice(product, packaging_id)
    const lineTotal = getOrderLineTotal(product, qty, packaging_id)
    const unitLabel = getOrderUnitLabel(product, packaging_id)
    return { product, quantity: qty, unitPrice, lineTotal, unitLabel, packaging_id }
  })

  await validateCartPackagingStock(lines)

  const total = prepared.reduce((sum, line) => sum + line.lineTotal, 0)
  const orderType: OrderType = prepared.some((line) =>
    isPreorderOrder(line.product),
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
      order_source: 'website',
      advance_payment: null,
      amount_received: null,
      admin_notes: null,
      delivery_charge: null,
      discount: null,
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
    await decrementPackagingStockForLines(
      prepared.map((line) => ({
        packaging_id: line.packaging_id,
        quantity: line.quantity,
        product: line.product,
      })),
    )
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

  try {
    await decrementPackagingStockForLines(
      prepared.map((line) => ({
        packaging_id: line.packaging_id,
        quantity: line.quantity,
        product: line.product,
      })),
    )
  } catch (stockError) {
    await supabase.from('orders').delete().eq('id', orderId)
    await supabase.from('order_items').delete().eq('order_id', orderId)
    throw stockError
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

export async function updateOrderPaymentDetails(
  orderId: string,
  details: {
    amount_received: number | null
    delivery_charge: number | null
    discount: number | null
    admin_notes: string | null
  },
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const order = seedOrders.find((o) => o.id === orderId)
    if (order) {
      order.amount_received = details.amount_received
      order.advance_payment = details.amount_received
      order.delivery_charge = details.delivery_charge
      order.discount = details.discount
      order.admin_notes = details.admin_notes
    }
    return
  }

  const payload = {
    amount_received: details.amount_received,
    advance_payment: details.amount_received,
    delivery_charge: details.delivery_charge,
    discount: details.discount,
    admin_notes: details.admin_notes?.trim() || null,
  }

  const { error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)

  if (error) {
    if (
      isMissingColumnError(error, [
        'amount_received',
        'admin_notes',
        'advance_payment',
        'delivery_charge',
        'discount',
      ])
    ) {
      throw new Error(
        'Payment, delivery, or discount columns are missing. Run supabase migrations 013, 016, and 017 in Supabase.',
      )
    }
    throw error
  }
}

/** @deprecated Use updateOrderPaymentDetails */
export async function updateOrderAdvancePayment(
  orderId: string,
  amount: number | null,
): Promise<void> {
  return updateOrderPaymentDetails(orderId, {
    amount_received: amount,
    delivery_charge: null,
    discount: null,
    admin_notes: null,
  })
}

export async function createManualOrder(
  form: ManualOrderFormData,
  products: Product[],
): Promise<Order> {
  if (form.lines.length === 0) {
    throw new Error('Add at least one product to the order.')
  }

  const prepared = form.lines.map((line) => {
    const product = products.find((p) => p.id === line.product_id)
    if (!product) {
      throw new Error('One or more selected products could not be found.')
    }
    if (hasPackagings(product) && !line.packaging_id) {
      throw new Error(`Select a box option for ${product.name}.`)
    }
    const qty = clampPackQuantity(line.quantity)
    const unitPrice = getOrderUnitPrice(product, line.packaging_id)
    const lineTotal = getOrderLineTotal(product, qty, line.packaging_id)
    const unitLabel = getOrderUnitLabel(product, line.packaging_id)
    return {
      product,
      quantity: qty,
      unitPrice,
      lineTotal,
      unitLabel,
      packaging_id: line.packaging_id,
    }
  })

  await validateCartPackagingStock(
    prepared.map((line) => ({
      product: line.product,
      packaging_id: line.packaging_id,
      quantity: line.quantity,
    })),
  )

  const total = prepared.reduce((sum, line) => sum + line.lineTotal, 0)
  const amountReceived =
    form.amount_received != null && form.amount_received > 0
      ? Math.round(form.amount_received)
      : null
  const deliveryCharge =
    form.delivery_charge != null && form.delivery_charge > 0
      ? Math.round(form.delivery_charge)
      : null
  const discount =
    form.discount != null && form.discount > 0 ? Math.round(form.discount) : null

  if (!isSupabaseConfigured || !supabase) {
    const orderId = `local-order-${crypto.randomUUID()}`
    const order: Order = {
      id: orderId,
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address_line: form.address_line.trim(),
      city: form.city.trim(),
      notes: form.notes.trim() || null,
      status: 'pending',
      order_type: form.order_type,
      order_source: 'whatsapp',
      advance_payment: amountReceived,
      amount_received: amountReceived,
      admin_notes: form.admin_notes.trim() || null,
      delivery_charge: deliveryCharge,
      discount,
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
    await decrementPackagingStockForLines(
      prepared.map((line) => ({
        packaging_id: line.packaging_id,
        quantity: line.quantity,
        product: line.product,
      })),
    )
    return { ...order, items }
  }

  const orderId = crypto.randomUUID()
  const orderPayload = {
    id: orderId,
    customer_name: form.customer_name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || null,
    address_line: form.address_line.trim(),
    city: form.city.trim(),
    notes: form.notes.trim() || null,
    status: 'pending' as const,
    total,
    order_type: form.order_type,
    order_source: 'whatsapp' as const,
    amount_received: amountReceived,
    advance_payment: amountReceived,
    admin_notes: form.admin_notes.trim() || null,
    delivery_charge: deliveryCharge,
    discount,
  }

  const { error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload)

  if (orderError) {
    throw new Error(supabaseErrorMessage(orderError))
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

  try {
    await decrementPackagingStockForLines(
      prepared.map((line) => ({
        packaging_id: line.packaging_id,
        quantity: line.quantity,
        product: line.product,
      })),
    )
  } catch (stockError) {
    await supabase.from('orders').delete().eq('id', orderId)
    await supabase.from('order_items').delete().eq('order_id', orderId)
    throw stockError
  }

  return normalizeOrderRow({
    ...orderPayload,
    created_at: new Date().toISOString(),
  } as Order)
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
