import type { Category, Product } from '../types'
import { MANGO_PRODUCT_IMAGES } from '../config/productImages'

const fruitsCategoryId = 'seed-fruits'
const mangoesSubcategoryId = 'seed-mangoes'

export const seedCategories: Category[] = [
  {
    id: fruitsCategoryId,
    name: 'Fruits',
    slug: 'fruits',
    description:
      'Fresh, seasonal organic fruits picked at peak ripeness.',
    parent_id: null,
    image_url: null,
    is_visible: true,
  },
  {
    id: mangoesSubcategoryId,
    name: 'Mangoes',
    slug: 'mangoes',
    description:
      'Premium Pakistani mango varieties — sweet, aromatic, and tree-ripened.',
    parent_id: fruitsCategoryId,
    image_url: null,
    is_visible: true,
  },
]

export const seedProducts: Product[] = [
  {
    id: 'seed-dasheri',
    category_id: mangoesSubcategoryId,
    name: 'Dasheri',
    description:
      'Sweet, aromatic Dasheri mango with golden-yellow flesh. Perfect for smoothies and desserts.',
    price: 2915,
    price_type: 'single',
    price_max: null,
    unit: 'kg',
    unit_min: null,
    unit_max: null,
    discount_percent: null,
    image_url: MANGO_PRODUCT_IMAGES.dasheri,
    in_stock: true,
    coming_soon: false,
    delivery_starts_at: null,
  },
  {
    id: 'seed-sindhri',
    category_id: mangoesSubcategoryId,
    name: 'Sindhri',
    description:
      'Large, honey-sweet Sindhri variety with minimal fiber. A summer favorite across Pakistan.',
    price: 2745,
    price_type: 'range',
    price_max: 3100,
    unit: 'kg',
    unit_min: null,
    unit_max: null,
    discount_percent: 10,
    image_url: MANGO_PRODUCT_IMAGES.sindhri,
    in_stock: true,
    coming_soon: false,
    delivery_starts_at: null,
  },
  {
    id: 'seed-chaunsa',
    category_id: mangoesSubcategoryId,
    name: 'Premium Chaunsa Mango',
    description:
      'Export-grade Premium Chaunsa — rich, honey-sweet flavour and buttery texture when ripe. Pre-order now; deliveries start from 5 July.',
    price: 2925,
    price_type: 'single',
    price_max: null,
    unit: 'kg',
    unit_min: null,
    unit_max: null,
    discount_percent: null,
    image_url: MANGO_PRODUCT_IMAGES.chaunsa,
    in_stock: true,
    coming_soon: true,
    delivery_starts_at: '2026-07-05',
  },
  {
    id: 'seed-anwar-ratol',
    category_id: mangoesSubcategoryId,
    name: 'Anwar Ratol',
    description:
      'Premium small-sized Anwar Ratol with exceptional sweetness and distinctive aroma.',
    price: 3015,
    price_type: 'range',
    price_max: 3450,
    unit: 'kg',
    unit_min: null,
    unit_max: null,
    discount_percent: null,
    image_url: MANGO_PRODUCT_IMAGES.anwarRatol,
    in_stock: true,
    coming_soon: false,
    delivery_starts_at: null,
  },
]
