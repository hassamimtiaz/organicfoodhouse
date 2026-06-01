import { normalizePriceType } from '../config/pricing'
import { seedCategories, seedProducts } from '../data/seed'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Category, PriceType, Product } from '../types'
import { isTopLevelCategory } from '../types'

function normalizeProduct(row: Product): Product {
  const price_type: PriceType = normalizePriceType(row.price_type, row.price_max)
  return {
    ...row,
    price: Number(row.price),
    price_type,
    price_max:
      price_type === 'range' && row.price_max != null
        ? Number(row.price_max)
        : null,
  }
}

function normalizeProducts(rows: Product[]): Product[] {
  return rows.map(normalizeProduct)
}

export async function fetchTopLevelCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return seedCategories.filter(isTopLevelCategory)
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchSubcategories(
  parentId: string,
): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return seedCategories.filter((c) => c.parent_id === parentId)
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchAllSubcategories(): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return seedCategories.filter((c) => c.parent_id !== null)
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .not('parent_id', 'is', null)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  if (!isSupabaseConfigured || !supabase) {
    return (
      seedCategories.find((c) => c.slug === slug && isTopLevelCategory(c)) ??
      null
    )
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .is('parent_id', null)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function fetchSubcategoryBySlug(
  parentSlug: string,
  subcategorySlug: string,
): Promise<{ parent: Category; subcategory: Category } | null> {
  if (!isSupabaseConfigured || !supabase) {
    const parent = seedCategories.find(
      (c) => c.slug === parentSlug && isTopLevelCategory(c),
    )
    if (!parent) return null
    const subcategory = seedCategories.find(
      (c) => c.slug === subcategorySlug && c.parent_id === parent.id,
    )
    if (!subcategory) return null
    return { parent, subcategory }
  }

  const { data: parent, error: parentError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', parentSlug)
    .is('parent_id', null)
    .maybeSingle()

  if (parentError) throw parentError
  if (!parent) return null

  const { data: subcategory, error: subError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', subcategorySlug)
    .eq('parent_id', parent.id)
    .maybeSingle()

  if (subError) throw subError
  if (!subcategory) return null

  return { parent, subcategory }
}

export async function fetchProductsBySubcategory(
  subcategoryId: string,
): Promise<Product[]> {
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

export function formatSubcategoryLabel(
  sub: Category,
  topLevel: Category[],
): string {
  const parent = topLevel.find((c) => c.id === sub.parent_id)
  return parent ? `${parent.name} › ${sub.name}` : sub.name
}

export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase().replace(/[%_]/g, '')
  if (!q) return []

  if (!isSupabaseConfigured || !supabase) {
    return seedProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false),
    )
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .order('name')

  if (error) throw error
  return normalizeProducts(data ?? [])
}

export async function fetchAllCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase) {
    return seedCategories
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}
