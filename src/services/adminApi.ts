import { seedCategories, seedProducts } from '../data/seed'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  isMissingColumnError,
  supabaseErrorMessage,
} from '../lib/supabaseErrors'
import type {
  Category,
  CategoryFormData,
  Product,
  ProductFormData,
} from '../types'

function unitFields(form: ProductFormData) {
  if (form.unit_type === 'range') {
    if (form.unit_min == null || form.unit_max == null) {
      throw new Error('For a unit range, enter both minimum and maximum size.')
    }
    if (form.unit_max < form.unit_min) {
      throw new Error(
        'For a unit range, maximum size must be greater than or equal to minimum size.',
      )
    }
    return {
      unit: form.unit,
      unit_min: form.unit_min,
      unit_max: form.unit_max,
    }
  }

  return {
    unit: form.unit,
    unit_min: null,
    unit_max: null,
  }
}

function productPayload(form: ProductFormData) {
  if (form.price_type === 'range') {
    if (form.price_max == null || form.price_max < form.price) {
      throw new Error(
        'For a price range, maximum price must be greater than or equal to minimum price.',
      )
    }
  }

  return {
    category_id: form.category_id,
    name: form.name,
    description: form.description || null,
    price: form.price,
    price_type: form.price_type,
    price_max: form.price_type === 'range' ? form.price_max : null,
    ...unitFields(form),
    image_url: form.image_url || null,
    in_stock: form.in_stock,
  }
}

function payloadWithoutUnitRange(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { unit_min: _min, unit_max: _max, ...rest } = payload
  return rest
}

function legacyProductPayload(form: ProductFormData) {
  return {
    category_id: form.category_id,
    name: form.name,
    description: form.description || null,
    price: form.price,
    unit: form.unit,
    image_url: form.image_url || null,
    in_stock: form.in_stock,
  }
}

function payloadWithoutPriceRange(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { price_type: _pt, price_max: _pm, ...rest } = payload
  return rest
}

async function writeProductRow(
  mode: 'insert' | 'update',
  id: string | null,
  form: ProductFormData,
): Promise<Product> {
  const fullPayload = productPayload(form)
  const attempts: Record<string, unknown>[] = [
    fullPayload,
    payloadWithoutUnitRange(fullPayload),
    payloadWithoutPriceRange(payloadWithoutUnitRange(fullPayload)),
    legacyProductPayload(form),
  ]

  const seen = new Set<string>()
  let lastError: unknown = null

  for (const payload of attempts) {
    const key = JSON.stringify(payload)
    if (seen.has(key)) continue
    seen.add(key)

    const result =
      mode === 'insert'
        ? await supabase!.from('products').insert(payload).select().single()
        : await supabase!
            .from('products')
            .update(payload)
            .eq('id', id!)
            .select()
            .single()

    if (!result.error) return result.data as Product

    lastError = result.error
    const retryable =
      isMissingColumnError(result.error, [
        'price_type',
        'price_max',
        'unit_min',
        'unit_max',
      ]) ||
      (result.error as { code?: string }).code === 'PGRST204'

    if (!retryable) break
  }

  throw new Error(supabaseErrorMessage(lastError))
}

function requireSupabaseForWrite() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Admin writes require Supabase. Configure .env and sign in with an admin account.',
    )
  }
}

export async function createProduct(form: ProductFormData): Promise<Product> {
  const payload = productPayload(form)

  if (!isSupabaseConfigured || !supabase) {
    const product: Product = {
      id: `local-${crypto.randomUUID()}`,
      ...payload,
    }
    seedProducts.push(product)
    return product
  }

  requireSupabaseForWrite()
  return writeProductRow('insert', null, form)
}

export async function updateProduct(
  id: string,
  form: ProductFormData,
): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    const index = seedProducts.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Product not found')
    const updated: Product = {
      id,
      ...productPayload(form),
    }
    seedProducts[index] = updated
    return updated
  }

  requireSupabaseForWrite()
  return writeProductRow('update', id, form)
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const index = seedProducts.findIndex((p) => p.id === id)
    if (index !== -1) seedProducts.splice(index, 1)
    return
  }

  requireSupabaseForWrite()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(supabaseErrorMessage(error))
}

export async function createCategory(
  form: CategoryFormData,
): Promise<Category> {
  if (!isSupabaseConfigured || !supabase) {
    const category: Category = {
      id: `local-${crypto.randomUUID()}`,
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      parent_id: form.parent_id,
    }
    seedCategories.push(category)
    return category
  }

  requireSupabaseForWrite()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      parent_id: form.parent_id,
    })
    .select()
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return data
}

export async function updateCategory(
  id: string,
  form: CategoryFormData,
): Promise<Category> {
  if (!isSupabaseConfigured || !supabase) {
    const index = seedCategories.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Category not found')
    const updated: Category = {
      id,
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      parent_id: form.parent_id,
    }
    seedCategories[index] = updated
    return updated
  }

  requireSupabaseForWrite()

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      parent_id: form.parent_id,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return data
}

const PRODUCT_IMAGES_BUCKET = 'product-images'

export async function uploadProductImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPEG, PNG, or WebP).')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be 5 MB or smaller.')
  }

  if (!isSupabaseConfigured || !supabase) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(file)
    })
  }

  requireSupabaseForWrite()

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    throw new Error(
      uploadError.message.includes('Bucket not found')
        ? 'Storage bucket missing. Run supabase/migrations/004_product_images_storage.sql in Supabase.'
        : uploadError.message,
    )
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    const index = seedCategories.findIndex((c) => c.id === id)
    if (index !== -1) seedCategories.splice(index, 1)
    return
  }

  requireSupabaseForWrite()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(supabaseErrorMessage(error))
}
