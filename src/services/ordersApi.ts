import { seedOrderItems, seedOrders } from '../data/seedOrders'
import { seedCategories, seedProducts } from '../data/seed'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { normalizePriceType, getOrderLineTotal, getOrderUnitPrice } from '../config/pricing'
import { formatUnitLabel } from '../config/units'
import type {
  Order,
  OrderItem,
  OrderStatus,
  PlaceOrderFormData,
  Product,
} from '../types'

export async function fetchProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) {
    return seedProducts.find((p) => p.id === id) ?? null
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const price_type = normalizePriceType(data.price_type, data.price_max)
  return {
    ...data,
    price: Number(data.price),
    price_type,
    price_max:
      price_type === 'range' && data.price_max != null
        ? Number(data.price_max)
        : null,
    unit_min:
      data.unit_min != null && data.unit_min !== undefined
        ? Number(data.unit_min)
        : null,
    unit_max:
      data.unit_max != null && data.unit_max !== undefined
        ? Number(data.unit_max)
        : null,
  }
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

export async function placeOrder(
  product: Product,
  form: PlaceOrderFormData,
): Promise<Order> {
  const unitPrice = getOrderUnitPrice(product)
  const lineTotal = getOrderLineTotal(product, form.quantity)
  const total = lineTotal
  const unitLabel = formatUnitLabel(product)

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
      total,
      created_at: new Date().toISOString(),
    }
    const item: OrderItem = {
      id: `local-item-${crypto.randomUUID()}`,
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      quantity: form.quantity,
      unit_price: unitPrice,
      unit: unitLabel,
      line_total: lineTotal,
    }
    seedOrders.unshift(order)
    seedOrderItems.push(item)
    return { ...order, items: [item] }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: form.customer_name,
      phone: form.phone,
      email: form.email || null,
      address_line: form.address_line,
      city: form.city,
      notes: form.notes || null,
      status: 'pending',
      total,
    })
    .select()
    .single()

  if (orderError) throw orderError

  const { error: itemError } = await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    product_name: product.name,
    quantity: form.quantity,
    unit_price: unitPrice,
    unit: unitLabel,
    line_total: lineTotal,
  })

  if (itemError) throw itemError

  return order
}

export async function fetchAllOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) {
    return seedOrders.map((o) => ({
      ...o,
      items: seedOrderItems.filter((i) => i.order_id === o.id),
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

  return orders.map((o) => ({
    ...o,
    items: items?.filter((i) => i.order_id === o.id) ?? [],
  }))
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
