import { seedCategories, seedProducts } from '../data/seed'
import { sortPackagings, syncProductPriceFromPackagings } from '../config/packaging'
import { normalizeProductImages } from '../config/productImages'
import { normalizeProductRow } from '../lib/productNormalize'
import { slugFromName } from '../lib/slugify'
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
  ProductPackaging,
  ProductPackagingFormData,
  ProductImage,
  ProductImageFormData,
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

function discountField(form: ProductFormData) {
  if (form.discount_percent == null) return { discount_percent: null }
  if (form.discount_percent <= 0 || form.discount_percent > 100) {
    throw new Error('Discount must be between 1 and 100 percent.')
  }
  return { discount_percent: form.discount_percent }
}

function validatePackagings(packagings: ProductPackagingFormData[]) {
  for (const row of packagings) {
    if (!row.label.trim()) {
      throw new Error('Each Box option needs a label (e.g. Gift Box).')
    }
    if (row.weight <= 0) {
      throw new Error('Box weight must be greater than zero.')
    }
    if (row.price < 0) {
      throw new Error('Box price cannot be negative.')
    }
  }
}

function packagingStockFields(row: ProductPackagingFormData) {
  const stockQuantity =
    row.stock_quantity != null && row.stock_quantity >= 0
      ? Math.round(row.stock_quantity)
      : null
  return {
    stock_quantity: stockQuantity,
    in_stock:
      stockQuantity != null ? stockQuantity > 0 : row.in_stock !== false,
  }
}

function normalizePackagingFormRows(
  packagings: ProductPackagingFormData[],
): ProductPackagingFormData[] {
  return packagings.map((row, index) => ({
    ...row,
    label: row.label.trim(),
    unit: row.unit.trim() || 'kg',
    sort_order: index,
  }))
}

function normalizeImageFormRows(
  images: ProductImageFormData[],
): ProductImageFormData[] {
  return images
    .map((row, index) => ({
      ...row,
      image_url: row.image_url.trim(),
      sort_order: index,
    }))
    .filter((row) => row.image_url.length > 0)
}

function productPayload(form: ProductFormData) {
  if (form.price_type === 'range') {
    if (form.price_max == null || form.price_max < form.price) {
      throw new Error(
        'For a price range, maximum price must be greater than or equal to minimum price.',
      )
    }
  }

  const packagings = normalizePackagingFormRows(form.packagings ?? [])
  if (packagings.length > 0) {
    validatePackagings(packagings)
  }

  const synced = syncProductPriceFromPackagings(
    { price: form.price, unit: form.unit },
    packagings.map((row, index) => ({
      id: row.id ?? `temp-${index}`,
      product_id: '',
      label: row.label,
      weight: row.weight,
      unit: row.unit,
      price: row.price,
      sort_order: row.sort_order,
      ...packagingStockFields(row),
    })),
  )

  return {
    category_id: form.category_id,
    slug: (form.slug || slugFromName(form.name)).trim() || 'product',
    name: form.name,
    description: form.description || null,
    price: packagings.length > 0 ? synced.price : form.price,
    price_type: packagings.length > 0 ? 'single' : form.price_type,
    price_max:
      packagings.length > 0
        ? null
        : form.price_type === 'range'
          ? form.price_max
          : null,
    ...(packagings.length > 0
      ? { unit: synced.unit, unit_min: null, unit_max: null }
      : unitFields(form)),
    ...discountField(form),
    image_url:
      normalizeImageFormRows(form.images ?? [])[0]?.image_url ||
      form.image_url ||
      null,
    in_stock: form.in_stock,
    coming_soon: form.coming_soon,
    sold_out_mode: form.in_stock ? 'block' : form.sold_out_mode,
    delivery_starts_at:
      form.coming_soon && form.delivery_starts_at ? form.delivery_starts_at : null,
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
    in_stock: form.in_stock,
  }
}

function payloadWithoutDiscount(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { discount_percent: _d, ...rest } = payload
  return rest
}

function payloadWithoutPriceRange(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { price_type: _pt, price_max: _pm, ...rest } = payload
  return rest
}

function payloadWithoutSoldOutMode(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { sold_out_mode: _m, ...rest } = payload
  return rest
}

function payloadWithoutPreorderFields(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { coming_soon: _cs, delivery_starts_at: _ds, ...rest } = payload
  return rest
}

function payloadWithoutImage(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { image_url: _img, ...rest } = payload
  return rest
}

function payloadWithoutSlug(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { slug: _s, ...rest } = payload
  return rest
}

async function syncProductPackagings(
  productId: string,
  packagings: ProductPackagingFormData[],
): Promise<ProductPackaging[]> {
  if (!isSupabaseConfigured || !supabase) {
    const rows: ProductPackaging[] = packagings.map((row, index) => ({
      id: row.id ?? `local-pack-${crypto.randomUUID()}`,
      product_id: productId,
      label: row.label,
      weight: row.weight,
      unit: row.unit,
      price: row.price,
      sort_order: index,
      ...packagingStockFields(row),
    }))
    const product = seedProducts.find((p) => p.id === productId)
    if (product) product.packagings = sortPackagings(rows)
    return rows
  }

  const normalized = normalizePackagingFormRows(packagings)
  const { data: existing, error: readError } = await supabase
    .from('product_packagings')
    .select('id')
    .eq('product_id', productId)

  if (readError) {
    if ((readError as { code?: string }).code === '42P01') return []
    throw new Error(supabaseErrorMessage(readError))
  }

  const keepIds = new Set(
    normalized.map((row) => row.id).filter((id): id is string => Boolean(id)),
  )
  const deleteIds = (existing ?? [])
    .map((row) => row.id as string)
    .filter((id) => !keepIds.has(id))

  if (deleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('product_packagings')
      .delete()
      .in('id', deleteIds)
    if (deleteError) throw new Error(supabaseErrorMessage(deleteError))
  }

  if (normalized.length === 0) return []

  const saved: ProductPackaging[] = []
  for (const [index, row] of normalized.entries()) {
    const payload = {
      product_id: productId,
      label: row.label,
      weight: row.weight,
      unit: row.unit,
      price: row.price,
      sort_order: index,
      ...packagingStockFields(row),
    }

    if (row.id) {
      const { data, error } = await supabase
        .from('product_packagings')
        .update(payload)
        .eq('id', row.id)
        .select()
        .single()
      if (error) throw new Error(supabaseErrorMessage(error))
      saved.push(data as ProductPackaging)
      continue
    }

    const { data, error } = await supabase
      .from('product_packagings')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(supabaseErrorMessage(error))
    saved.push(data as ProductPackaging)
  }

  return sortPackagings(saved)
}

async function syncProductImages(
  productId: string,
  images: ProductImageFormData[],
): Promise<ProductImage[]> {
  const normalized = normalizeImageFormRows(images)

  if (!isSupabaseConfigured || !supabase) {
    const rows: ProductImage[] = normalized.map((row, index) => ({
      id: row.id ?? `local-img-${crypto.randomUUID()}`,
      product_id: productId,
      image_url: row.image_url,
      sort_order: index,
    }))
    const product = seedProducts.find((p) => p.id === productId)
    if (product) {
      product.images = normalizeProductImages(rows)
      product.image_url = rows[0]?.image_url ?? null
    }
    return rows
  }

  const { data: existing, error: readError } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)

  if (readError) {
    if ((readError as { code?: string }).code === '42P01') return []
    throw new Error(supabaseErrorMessage(readError))
  }

  const keepIds = new Set(
    normalized.map((row) => row.id).filter((id): id is string => Boolean(id)),
  )
  const deleteIds = (existing ?? [])
    .map((row) => row.id as string)
    .filter((id) => !keepIds.has(id))

  if (deleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .in('id', deleteIds)
    if (deleteError) throw new Error(supabaseErrorMessage(deleteError))
  }

  if (normalized.length === 0) return []

  const saved: ProductImage[] = []
  for (const [index, row] of normalized.entries()) {
    const payload = {
      product_id: productId,
      image_url: row.image_url,
      sort_order: index,
    }

    if (row.id) {
      const { data, error } = await supabase
        .from('product_images')
        .update(payload)
        .eq('id', row.id)
        .select()
        .single()
      if (error) throw new Error(supabaseErrorMessage(error))
      saved.push(data as ProductImage)
      continue
    }

    const { data, error } = await supabase
      .from('product_images')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(supabaseErrorMessage(error))
    saved.push(data as ProductImage)
  }

  return normalizeProductImages(saved)
}

async function writeProductRow(
  mode: 'insert' | 'update',
  id: string | null,
  form: ProductFormData,
): Promise<Product> {
  const fullPayload = productPayload(form)
  const withoutDiscount = payloadWithoutDiscount(fullPayload)
  const attempts: Record<string, unknown>[] = [
    fullPayload,
    payloadWithoutSlug(fullPayload),
    payloadWithoutImage(fullPayload),
    withoutDiscount,
    payloadWithoutImage(withoutDiscount),
    payloadWithoutUnitRange(fullPayload),
    payloadWithoutUnitRange(withoutDiscount),
    payloadWithoutPriceRange(payloadWithoutUnitRange(withoutDiscount)),
    payloadWithoutPreorderFields(fullPayload),
    payloadWithoutSoldOutMode(fullPayload),
    payloadWithoutSoldOutMode(payloadWithoutPreorderFields(fullPayload)),
    payloadWithoutUnitRange(fullPayload),
    payloadWithoutUnitRange(payloadWithoutPreorderFields(fullPayload)),
    payloadWithoutPriceRange(payloadWithoutUnitRange(payloadWithoutPreorderFields(fullPayload))),
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

    if (!result.error) {
      const product = normalizeProductRow(result.data as Product)
      const [packagings, images] = await Promise.all([
        syncProductPackagings(product.id, form.packagings ?? []),
        syncProductImages(product.id, form.images ?? []),
      ])
      return {
        ...product,
        packagings,
        images,
        image_url: images[0]?.image_url ?? product.image_url,
      }
    }

    lastError = result.error
    const retryable =
      isMissingColumnError(result.error, [
        'price_type',
        'price_max',
        'unit_min',
        'unit_max',
        'discount_percent',
        'coming_soon',
        'delivery_starts_at',
        'image_url',
        'slug',
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
  if (!isSupabaseConfigured || !supabase) {
    const packagings = normalizePackagingFormRows(form.packagings ?? [])
    if (packagings.length > 0) validatePackagings(packagings)
    const payload = productPayload(form)
    const product: Product = {
      id: `local-${crypto.randomUUID()}`,
      ...payload,
      packagings: [],
      images: [],
    }
    seedProducts.push(product)
    product.packagings = await syncProductPackagings(product.id, packagings)
    product.images = await syncProductImages(product.id, form.images ?? [])
    product.image_url = product.images[0]?.image_url ?? product.image_url
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
    const packagings = normalizePackagingFormRows(form.packagings ?? [])
    if (packagings.length > 0) validatePackagings(packagings)
    const updated: Product = {
      ...seedProducts[index],
      ...productPayload(form),
      id,
    }
    seedProducts[index] = updated
    updated.packagings = await syncProductPackagings(id, packagings)
    updated.images = await syncProductImages(id, form.images ?? [])
    updated.image_url = updated.images[0]?.image_url ?? updated.image_url
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
  const payload = categoryPayload(form)

  if (!isSupabaseConfigured || !supabase) {
    const category: Category = {
      id: `local-${crypto.randomUUID()}`,
      ...payload,
    }
    seedCategories.push(category)
    return category
  }

  requireSupabaseForWrite()
  return writeCategoryRow('insert', null, form)
}

export async function updateCategory(
  id: string,
  form: CategoryFormData,
): Promise<Category> {
  if (!isSupabaseConfigured || !supabase) {
    const index = seedCategories.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Category not found')
    seedCategories[index] = { id, ...categoryPayload(form) }
    return seedCategories[index]
  }

  requireSupabaseForWrite()
  return writeCategoryRow('update', id, form)
}

export async function setCategoryVisibility(
  id: string,
  is_visible: boolean,
): Promise<Category> {
  if (!isSupabaseConfigured || !supabase) {
    const index = seedCategories.findIndex((c) => c.id === id)
    if (index === -1) throw new Error('Category not found')
    seedCategories[index] = { ...seedCategories[index], is_visible }
    return seedCategories[index]
  }

  requireSupabaseForWrite()

  const { data, error } = await supabase
    .from('categories')
    .update({ is_visible })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return data
}

function categoryPayload(form: CategoryFormData) {
  return {
    name: form.name,
    slug: form.slug,
    description: form.description || null,
    parent_id: form.parent_id,
    image_url: form.image_url || null,
    is_visible: form.is_visible,
  }
}

function legacyCategoryPayload(form: CategoryFormData) {
  return {
    name: form.name,
    slug: form.slug,
    description: form.description || null,
    parent_id: form.parent_id,
  }
}

function payloadWithoutCategoryImage(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { image_url: _img, ...rest } = payload
  return rest
}

function payloadWithoutCategoryVisibility(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const { is_visible: _vis, ...rest } = payload
  return rest
}

async function writeCategoryRow(
  mode: 'insert' | 'update',
  id: string | null,
  form: CategoryFormData,
): Promise<Category> {
  const fullPayload = categoryPayload(form)
  const attempts: Record<string, unknown>[] = [
    fullPayload,
    payloadWithoutCategoryImage(fullPayload),
    payloadWithoutCategoryVisibility(payloadWithoutCategoryImage(fullPayload)),
    legacyCategoryPayload(form),
  ]

  const seen = new Set<string>()
  let lastError: unknown = null

  for (const payload of attempts) {
    const key = JSON.stringify(payload)
    if (seen.has(key)) continue
    seen.add(key)

    const result =
      mode === 'insert'
        ? await supabase!.from('categories').insert(payload).select().single()
        : await supabase!
            .from('categories')
            .update(payload)
            .eq('id', id!)
            .select()
            .single()

    if (!result.error) return result.data as Category

    lastError = result.error
    const retryable =
      isMissingColumnError(result.error, [
        'image_url',
        'is_visible',
      ]) || (result.error as { code?: string }).code === 'PGRST204'

    if (!retryable) break
  }

  throw new Error(supabaseErrorMessage(lastError))
}

const PRODUCT_IMAGES_BUCKET = 'product-images'

async function uploadImage(file: File, folder: string): Promise<string> {
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
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

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

export async function uploadCategoryImage(file: File): Promise<string> {
  return uploadImage(file, 'categories')
}

export async function uploadProductImage(file: File): Promise<string> {
  return uploadImage(file, 'products')
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
