import { getPackagingById, hasPackagings } from '../config/packaging'
import { isSupabaseConfigured, supabase } from './supabase'
import { seedProducts } from '../data/seed'
import type { CartLine, ProductPackaging } from '../types'

/** Show "X remaining" when tracked stock is below this level */
export const LOW_STOCK_THRESHOLD = 10

export function isPackagingStockTracked(
  packaging: Pick<ProductPackaging, 'stock_quantity'>,
): boolean {
  return packaging.stock_quantity != null
}

export function getPackagingRemaining(
  packaging: Pick<ProductPackaging, 'stock_quantity'>,
): number | null {
  if (!isPackagingStockTracked(packaging)) return null
  return Math.max(0, Math.round(Number(packaging.stock_quantity)))
}

export function isPackagingOrderable(
  packaging: Pick<ProductPackaging, 'in_stock' | 'stock_quantity'>,
): boolean {
  const remaining = getPackagingRemaining(packaging)
  if (remaining != null) return remaining > 0
  return packaging.in_stock !== false
}

export function shouldShowLowStock(remaining: number): boolean {
  return remaining > 0 && remaining <= LOW_STOCK_THRESHOLD
}

export function formatPackagingStockHint(remaining: number): string {
  if (remaining === 1) return 'Only 1 box left'
  return `${remaining} remaining`
}

export function getPackagingMaxQuantity(
  packaging: Pick<ProductPackaging, 'stock_quantity' | 'in_stock'>,
  alreadyOrdered = 0,
): number | null {
  const remaining = getPackagingRemaining(packaging)
  if (remaining == null) return null
  return Math.max(0, remaining - alreadyOrdered)
}

export function clampToPackagingStock(
  packaging: Pick<ProductPackaging, 'stock_quantity' | 'in_stock'>,
  requested: number,
  alreadyInCart = 0,
): number {
  const max = getPackagingMaxQuantity(packaging, alreadyInCart)
  if (max == null) return requested
  return Math.min(requested, max)
}

export type StockLine = {
  packaging_id: string | null | undefined
  quantity: number
  productName?: string
}

function localDecrement(packagingId: string, quantity: number): void {
  for (const product of seedProducts) {
    const packaging = product.packagings?.find((p) => p.id === packagingId)
    if (!packaging || !isPackagingStockTracked(packaging)) return
    const remaining = getPackagingRemaining(packaging)!
    if (quantity > remaining) {
      throw new Error('Not enough boxes in stock for this option.')
    }
    const next = remaining - quantity
    packaging.stock_quantity = next
    packaging.in_stock = next > 0
    return
  }
}

export async function fetchPackagingStockRows(
  packagingIds: string[],
): Promise<Map<string, ProductPackaging>> {
  const map = new Map<string, ProductPackaging>()
  if (packagingIds.length === 0) return map

  if (!isSupabaseConfigured || !supabase) {
    for (const product of seedProducts) {
      for (const packaging of product.packagings ?? []) {
        if (packagingIds.includes(packaging.id)) {
          map.set(packaging.id, packaging)
        }
      }
    }
    return map
  }

  const { data, error } = await supabase
    .from('product_packagings')
    .select('*')
    .in('id', packagingIds)

  if (error) throw error
  for (const row of data ?? []) {
    map.set(row.id as string, row as ProductPackaging)
  }
  return map
}

export function validateStockForLines(
  lines: StockLine[],
  stockById: Map<string, ProductPackaging>,
): void {
  const needed = new Map<string, number>()

  for (const line of lines) {
    if (!line.packaging_id) continue
    const packaging = stockById.get(line.packaging_id)
    if (!packaging) continue
    if (!isPackagingStockTracked(packaging)) continue
    needed.set(
      line.packaging_id,
      (needed.get(line.packaging_id) ?? 0) + Math.round(line.quantity),
    )
  }

  for (const [packagingId, qty] of needed) {
    const packaging = stockById.get(packagingId)!
    const remaining = getPackagingRemaining(packaging) ?? 0
    if (qty > remaining) {
      const label = packaging.label?.trim() || 'This box option'
      throw new Error(
        `Only ${remaining} box${remaining === 1 ? '' : 'es'} left for ${label}. Please reduce quantity or choose another size.`,
      )
    }
  }
}

export async function validateCartPackagingStock(lines: CartLine[]): Promise<void> {
  const packagingIds = [
    ...new Set(
      lines
        .map((line) => line.packaging_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const stockById = await fetchPackagingStockRows(packagingIds)
  validateStockForLines(
    lines.map((line) => ({
      packaging_id: line.packaging_id,
      quantity: line.quantity,
      productName: line.product.name,
    })),
    stockById,
  )
}

export async function decrementPackagingStockForLines(
  lines: StockLine[],
): Promise<void> {
  const totals = new Map<string, number>()
  for (const line of lines) {
    if (!line.packaging_id) continue
    totals.set(
      line.packaging_id,
      (totals.get(line.packaging_id) ?? 0) + Math.round(line.quantity),
    )
  }

  for (const [packagingId, quantity] of totals) {
    if (!isSupabaseConfigured || !supabase) {
      localDecrement(packagingId, quantity)
      continue
    }

    const { error } = await supabase.rpc('decrement_packaging_stock', {
      p_packaging_id: packagingId,
      p_quantity: quantity,
    })

    if (error) {
      throw new Error(
        error.message.includes('Not enough boxes')
          ? 'One or more box options just sold out. Please refresh and try again.'
          : error.message,
      )
    }
  }
}

export function getCartLineMaxQuantity(line: CartLine): number | null {
  if (!hasPackagings(line.product) || !line.packaging_id) return null
  const packaging = getPackagingById(line.product, line.packaging_id)
  if (!packaging) return null
  return getPackagingMaxQuantity(packaging)
}
