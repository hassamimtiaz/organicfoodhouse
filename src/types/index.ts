export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_url: string | null
  is_visible: boolean
  created_at?: string
}

export type PriceType = 'single' | 'range'
export type UnitType = 'single' | 'range'

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  sort_order: number
}

export interface ProductImageFormData {
  id?: string
  image_url: string
  sort_order?: number
}

export interface ProductPackaging {
  id: string
  product_id: string
  label: string
  weight: number
  unit: string
  price: number
  sort_order: number
  in_stock: boolean
  /** Boxes remaining; null = unlimited / not tracked */
  stock_quantity: number | null
}

export interface ProductPackagingFormData {
  id?: string
  label: string
  weight: number
  unit: string
  price: number
  sort_order: number
  in_stock: boolean
  stock_quantity: number | null
}

export type SoldOutMode = 'block' | 'preorder' | 'restock'

export interface Product {
  id: string
  category_id: string
  slug: string
  name: string
  description: string | null
  price: number
  price_type: PriceType
  price_max: number | null
  unit: string
  unit_min: number | null
  unit_max: number | null
  discount_percent: number | null
  image_url: string | null
  in_stock: boolean
  coming_soon: boolean
  sold_out_mode: SoldOutMode
  delivery_starts_at: string | null
  created_at?: string
  packagings?: ProductPackaging[]
  images?: ProductImage[]
  subcategory?: Category
  parent_category?: Category
}

export interface ProductFormData {
  category_id: string
  slug: string
  name: string
  description: string
  price_type: PriceType
  price: number
  price_max: number | null
  unit_type: UnitType
  unit: string
  unit_min: number | null
  unit_max: number | null
  discount_percent: number | null
  image_url: string
  in_stock: boolean
  coming_soon: boolean
  sold_out_mode: SoldOutMode
  delivery_starts_at: string
  packagings: ProductPackagingFormData[]
  images: ProductImageFormData[]
}

export interface CategoryFormData {
  name: string
  slug: string
  description: string
  parent_id: string | null
  image_url: string
  is_visible: boolean
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type OrderType = 'preorder' | 'order'
export type OrderSource = 'website' | 'whatsapp'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  unit: string
  line_total: number
}

export interface Order {
  id: string
  customer_name: string
  phone: string
  email: string | null
  address_line: string
  city: string
  notes: string | null
  status: OrderStatus
  order_type: OrderType
  order_source: OrderSource
  advance_payment: number | null
  amount_received: number | null
  admin_notes: string | null
  /** Delivery fee charged (PKR), separate from product line total */
  delivery_charge: number | null
  /** Discount given (PKR), reduces grand total for balance due */
  discount: number | null
  total: number
  created_at: string
  items?: OrderItem[]
}

export interface ManualOrderLineForm {
  product_id: string
  packaging_id?: string | null
  quantity: number
}

export interface ManualOrderFormData {
  customer_name: string
  phone: string
  email: string
  address_line: string
  city: string
  notes: string
  order_type: OrderType
  admin_notes: string
  amount_received: number | null
  delivery_charge: number | null
  discount: number | null
  lines: ManualOrderLineForm[]
}

export interface PlaceOrderFormData {
  customer_name: string
  phone: string
  email: string
  address_line: string
  city: string
  notes: string
  quantity: number
}

export type CheckoutFormData = Omit<PlaceOrderFormData, 'quantity'>

export interface CartLine {
  product: Product
  packaging_id?: string | null
  quantity: number
}

export interface OrderSuccessPayload {
  customerName: string
  phone: string
  isPreorder: boolean
  productIds: string[]
  productNames: string[]
  categoryPath: { parentSlug: string; subSlug: string } | null
}

export function isTopLevelCategory(category: Category): boolean {
  return category.parent_id === null
}
