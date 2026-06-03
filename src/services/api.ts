import { normalizePriceType } from '../config/pricing'
import { seedCategories, seedProducts } from '../data/seed'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Category, PriceType, Product } from '../types'
import { isTopLevelCategory } from '../types'

export type FetchOptions = {
  /** Include categories hidden from the storefront (admin only) */
  includeHidden?: boolean
}

export function isCategoryVisible(category: Category): boolean {
  return category.is_visible !== false
}

function normalizeCategory(row: Category): Category {
  return {
    ...row,
    image_url: row.image_url ?? null,
    is_visible: row.is_visible !== false,
  }
}

function normalizeCategories(rows: Category[]): Category[] {
  return rows.map(normalizeCategory)
}

function filterVisibleCategories(
  categories: Category[],
  allCategories: Category[],
): Category[] {
  const visibleIds = new Set(
    categories.filter(isCategoryVisible).map((c) => c.id),
  )

  return categories.filter((c) => {
    if (!visibleIds.has(c.id)) return false
    if (!c.parent_id) return true
    const parent = allCategories.find((p) => p.id === c.parent_id)
    return parent ? isCategoryVisible(parent) : false
  })
}

async function loadAllCategoriesRaw(): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return normalizeCategories(seedCategories)
  }

  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return normalizeCategories(data ?? [])
}

export function getVisibleSubcategoryIds(categories: Category[]): Set<string> {
  return new Set(
    filterVisibleCategories(
      categories.filter((c) => c.parent_id !== null),
      categories,
    ).map((c) => c.id),
  )
}

function normalizeProduct(row: Product): Product {
  const price_type: PriceType = normalizePriceType(row.price_type, row.price_max)
  const unit_min =
    row.unit_min != null && row.unit_min !== undefined
      ? Number(row.unit_min)
      : null
  const unit_max =
    row.unit_max != null && row.unit_max !== undefined
      ? Number(row.unit_max)
      : null

  return {
    ...row,
    price: Number(row.price),
    price_type,
    price_max:
      price_type === 'range' && row.price_max != null
        ? Number(row.price_max)
        : null,
    unit_min,
    unit_max,
    discount_percent:
      row.discount_percent != null && row.discount_percent !== undefined
        ? Number(row.discount_percent)
        : null,
  }
}

function normalizeProducts(rows: Product[]): Product[] {
  return rows.map(normalizeProduct)
}

export async function fetchTopLevelCategories(
  options: FetchOptions = {},
): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    const cats = seedCategories.filter(isTopLevelCategory).map(normalizeCategory)
    return options.includeHidden ? cats : cats.filter(isCategoryVisible)
  }

  let query = supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name')

  if (!options.includeHidden) {
    query = query.eq('is_visible', true)
  }

  const { data, error } = await query
  if (error) throw error
  return normalizeCategories(data ?? [])
}

export async function fetchSubcategories(
  parentId: string,
  options: FetchOptions = {},
): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    const all = normalizeCategories(seedCategories)
    const parent = all.find((c) => c.id === parentId)
    if (!parent || (!options.includeHidden && !isCategoryVisible(parent))) {
      return []
    }
    const subs = all.filter((c) => c.parent_id === parentId)
    return options.includeHidden ? subs : subs.filter(isCategoryVisible)
  }

  if (!options.includeHidden) {
    const { data: parent, error: parentError } = await supabase
      .from('categories')
      .select('is_visible')
      .eq('id', parentId)
      .maybeSingle()

    if (parentError) throw parentError
    if (!parent || parent.is_visible === false) return []
  }

  let query = supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .order('name')

  if (!options.includeHidden) {
    query = query.eq('is_visible', true)
  }

  const { data, error } = await query
  if (error) throw error
  return normalizeCategories(data ?? [])
}

export async function fetchAllSubcategories(
  options: FetchOptions = {},
): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    const all = normalizeCategories(seedCategories)
    const subs = all.filter((c) => c.parent_id !== null)
    return options.includeHidden
      ? subs
      : filterVisibleCategories(subs, all)
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .not('parent_id', 'is', null)
    .order('name')

  if (error) throw error
  const subs = normalizeCategories(data ?? [])
  if (options.includeHidden) return subs

  const all = await loadAllCategoriesRaw()
  return filterVisibleCategories(subs, all)
}

export async function fetchCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  if (!isSupabaseConfigured || !supabase) {
    const cat = seedCategories.find(
      (c) => c.slug === slug && isTopLevelCategory(c),
    )
    if (!cat || !isCategoryVisible(normalizeCategory(cat))) return null
    return normalizeCategory(cat)
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .is('parent_id', null)
    .eq('is_visible', true)
    .maybeSingle()

  if (error) throw error
  return data ? normalizeCategory(data) : null
}

export async function fetchSubcategoryBySlug(
  parentSlug: string,
  subcategorySlug: string,
): Promise<{ parent: Category; subcategory: Category } | null> {
  if (!isSupabaseConfigured || !supabase) {
    const all = normalizeCategories(seedCategories)
    const parent = all.find(
      (c) => c.slug === parentSlug && isTopLevelCategory(c),
    )
    if (!parent || !isCategoryVisible(parent)) return null
    const subcategory = all.find(
      (c) => c.slug === subcategorySlug && c.parent_id === parent.id,
    )
    if (!subcategory || !isCategoryVisible(subcategory)) return null
    return { parent, subcategory }
  }

  const { data: parent, error: parentError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', parentSlug)
    .is('parent_id', null)
    .eq('is_visible', true)
    .maybeSingle()

  if (parentError) throw parentError
  if (!parent) return null

  const { data: subcategory, error: subError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', subcategorySlug)
    .eq('parent_id', parent.id)
    .eq('is_visible', true)
    .maybeSingle()

  if (subError) throw subError
  if (!subcategory) return null

  return {
    parent: normalizeCategory(parent),
    subcategory: normalizeCategory(subcategory),
  }
}

export async function fetchProductsBySubcategory(
  subcategoryId: string,
): Promise<Product[]> {
  const categories = await loadAllCategoriesRaw()
  const sub = categories.find((c) => c.id === subcategoryId)
  if (!sub || !isCategoryVisible(sub)) return []
  if (sub.parent_id) {
    const parent = categories.find((c) => c.id === sub.parent_id)
    if (!parent || !isCategoryVisible(parent)) return []
  }

  if (!isSupabaseConfigured || !supabase) {
    return seedProducts.filter((p) => p.category_id === subcategoryId)
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', subcategoryId)
    .order('name')

  if (error) throw error
  return normalizeProducts(data ?? [])
}

export async function fetchAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    return seedProducts
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')

  if (error) throw error
  return normalizeProducts(data ?? [])
}

export async function fetchVisibleProducts(): Promise<Product[]> {
  const [products, categories] = await Promise.all([
    fetchAllProducts(),
    loadAllCategoriesRaw(),
  ])
  const visibleSubIds = getVisibleSubcategoryIds(categories)
  return products.filter((p) => visibleSubIds.has(p.category_id))
}

const RELATED_LIMIT = 4
const ALSO_LIKE_LIMIT = 4

export type ProductRecommendations = {
  related: Product[]
  alsoLike: Product[]
}

/** Same subcategory + sibling subcategories / catalog for detail-page sections */
export async function fetchProductRecommendations(
  product: Product,
): Promise<ProductRecommendations> {
  const categories = await loadAllCategoriesRaw()
  const sub = categories.find((c) => c.id === product.category_id)
  if (!sub) {
    return { related: [], alsoLike: [] }
  }

  const sameSubcategory = await fetchProductsBySubcategory(product.category_id)
  const related = sameSubcategory
    .filter((p) => p.id !== product.id)
    .slice(0, RELATED_LIMIT)

  const excluded = new Set([product.id, ...related.map((p) => p.id)])
  const alsoLike: Product[] = []

  if (sub.parent_id) {
    const siblingSubs = categories.filter(
      (c) =>
        c.parent_id === sub.parent_id &&
        c.id !== product.category_id &&
        isCategoryVisible(c),
    )

    for (const sibling of siblingSubs) {
      const items = await fetchProductsBySubcategory(sibling.id)
      for (const item of items) {
        if (!excluded.has(item.id)) {
          alsoLike.push(item)
          excluded.add(item.id)
          if (alsoLike.length >= ALSO_LIKE_LIMIT) break
        }
      }
      if (alsoLike.length >= ALSO_LIKE_LIMIT) break
    }
  }

  if (alsoLike.length < ALSO_LIKE_LIMIT) {
    const visible = await fetchVisibleProducts()
    for (const item of visible) {
      if (item.category_id === product.category_id || excluded.has(item.id)) {
        continue
      }
      alsoLike.push(item)
      excluded.add(item.id)
      if (alsoLike.length >= ALSO_LIKE_LIMIT) break
    }
  }

  return { related, alsoLike: alsoLike.slice(0, ALSO_LIKE_LIMIT) }
}

export function formatSubcategoryLabel(
  sub: Category,
  topLevel: Category[],
): string {
  const parent = topLevel.find((c) => c.id === sub.parent_id)
  const hidden = !isCategoryVisible(sub) ? ' (hidden)' : ''
  return parent ? `${parent.name} › ${sub.name}${hidden}` : `${sub.name}${hidden}`
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase().replace(/[%_]/g, '')
  if (!q) return []

  if (!isSupabaseConfigured || !supabase) {
    const categories = normalizeCategories(seedCategories)
    const visibleSubIds = getVisibleSubcategoryIds(categories)
    return seedProducts.filter(
      (p) =>
        visibleSubIds.has(p.category_id) &&
        (p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)),
    )
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .order('name')

  if (error) throw error

  const products = normalizeProducts(data ?? [])
  const categories = await loadAllCategoriesRaw()
  const visibleSubIds = getVisibleSubcategoryIds(categories)
  return products.filter((p) => visibleSubIds.has(p.category_id))
}

export async function fetchAllCategories(
  options: FetchOptions = {},
): Promise<Category[]> {
  const all = await loadAllCategoriesRaw()
  if (options.includeHidden) return all
  return filterVisibleCategories(all, all)
}
