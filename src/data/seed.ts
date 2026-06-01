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
  },
  {
    id: mangoesSubcategoryId,
    name: 'Mangoes',
    slug: 'mangoes',
    description:
      'Premium Pakistani mango varieties — sweet, aromatic, and tree-ripened.',
    parent_id: fruitsCategoryId,
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
    image_url: MANGO_PRODUCT_IMAGES.dasheri,
    in_stock: true,
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
    image_url: MANGO_PRODUCT_IMAGES.sindhri,
    in_stock: true,
  },
  {
    id: 'seed-chaunsa',
    category_id: mangoesSubcategoryId,
    name: 'Chaunsa',
    description:
      'Rich, intensely flavorful Chaunsa mango — the king of mangoes. Buttery texture when ripe.',
    price: 2925,
    price_type: 'single',
    price_max: null,
    unit: 'kg',
    image_url: MANGO_PRODUCT_IMAGES.chaunsa,
    in_stock: true,
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
    image_url: MANGO_PRODUCT_IMAGES.anwarRatol,
    in_stock: true,
  },
]
