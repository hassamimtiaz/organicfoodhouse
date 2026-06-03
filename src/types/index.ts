export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  created_at?: string
}

export type PriceType = 'single' | 'range'
export type UnitType = 'single' | 'range'

export interface Product {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  price_type: PriceType
  price_max: number | null
  unit: string
  unit_min: number | null
  unit_max: number | null
  image_url: string | null
  in_stock: boolean
  created_at?: string
  subcategory?: Category
  parent_category?: Category
}

export interface ProductFormData {
  category_id: string
  name: string
  description: string
  price_type: PriceType
  price: number
  price_max: number | null
  unit_type: UnitType
  unit: string
  unit_min: number | null
  unit_max: number | null
  image_url: string
  in_stock: boolean
}

export interface CategoryFormData {
  name: string
  slug: string
  description: string
  parent_id: string | null
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

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
  total: number
  created_at: string
  items?: OrderItem[]
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

export function isTopLevelCategory(category: Category): boolean {
  return category.parent_id === null
}
