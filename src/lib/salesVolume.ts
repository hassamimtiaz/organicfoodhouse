import type { Order, OrderItem, Product } from '../types'

export interface PackagingVariantSales {
  sizeLabel: string
  boxesSold: number
  weightPerBox: number | null
  weightUnit: string
  totalWeightKg: number | null
}

export interface ProductVolumeSummary {
  productId: string | null
  productName: string
  variants: PackagingVariantSales[]
  totalBoxes: number
  totalWeightKg: number | null
}

/** Parse leading weight from order line unit, e.g. "5 kg · Premium gift box". */
export function parsePackWeightFromUnitLabel(
  unit: string,
): { weight: number; unit: string } | null {
  const match = unit.trim().match(/^(\d+(?:\.\d+)?)\s*(kg|g|lb|lbs)\b/i)
  if (!match) return null
  return { weight: Number(match[1]), unit: match[2].toLowerCase() }
}

export function weightToKg(weight: number, unit: string): number {
  if (unit === 'g') return weight / 1000
  if (unit === 'lb' || unit === 'lbs') return weight * 0.453592
  return weight
}

function formatSizeLabel(weight: number, unit: string): string {
  const value = Number.isInteger(weight) ? String(weight) : String(weight)
  return `${value} ${unit.toLowerCase()}`
}

function getLineWeightKg(
  item: OrderItem,
  product?: Product | null,
): { perBoxKg: number | null; totalKg: number | null; sizeLabel: string } {
  const parsed = parsePackWeightFromUnitLabel(item.unit)
  if (parsed) {
    const perBoxKg = weightToKg(parsed.weight, parsed.unit)
    return {
      perBoxKg,
      totalKg: perBoxKg * Number(item.quantity),
      sizeLabel: formatSizeLabel(parsed.weight, parsed.unit),
    }
  }

  if (product?.unit_min != null && product.unit_min > 0) {
    const measure = (product.unit || 'kg').trim().toLowerCase()
    const perBoxKg = weightToKg(Number(product.unit_min), measure)
    return {
      perBoxKg,
      totalKg: perBoxKg * Number(item.quantity),
      sizeLabel: formatSizeLabel(Number(product.unit_min), measure),
    }
  }

  return {
    perBoxKg: null,
    totalKg: null,
    sizeLabel: item.unit.trim() || 'Unspecified',
  }
}

export function summarizeProductVolume(
  orders: Order[],
  products: Product[] = [],
  options?: { productId?: string | null },
): ProductVolumeSummary[] {
  const productId = options?.productId ?? null
  const productById = new Map(products.map((p) => [p.id, p]))
  const byProduct = new Map<
    string,
    {
      productId: string | null
      productName: string
      variants: Map<
        string,
        {
          sizeLabel: string
          boxesSold: number
          weightPerBox: number | null
          weightUnit: string
          totalWeightKg: number | null
        }
      >
      totalBoxes: number
      totalWeightKg: number
      hasWeight: boolean
    }
  >()

  for (const order of orders) {
    for (const item of order.items ?? []) {
      if (productId && item.product_id !== productId) continue
      const productKey = item.product_id ?? `name:${item.product_name}`
      const product = item.product_id
        ? productById.get(item.product_id)
        : undefined
      const weightInfo = getLineWeightKg(item, product)
      const qty = Number(item.quantity)

      let row = byProduct.get(productKey)
      if (!row) {
        row = {
          productId: item.product_id,
          productName: item.product_name,
          variants: new Map(),
          totalBoxes: 0,
          totalWeightKg: 0,
          hasWeight: false,
        }
        byProduct.set(productKey, row)
      }

      row.totalBoxes += qty
      if (weightInfo.totalKg != null) {
        row.totalWeightKg += weightInfo.totalKg
        row.hasWeight = true
      }

      const variantKey = weightInfo.sizeLabel
      let variant = row.variants.get(variantKey)
      if (!variant) {
        variant = {
          sizeLabel: weightInfo.sizeLabel,
          boxesSold: 0,
          weightPerBox: weightInfo.perBoxKg,
          weightUnit: 'kg',
          totalWeightKg: 0,
        }
        row.variants.set(variantKey, variant)
      }

      variant.boxesSold += qty
      if (weightInfo.totalKg != null) {
        variant.totalWeightKg =
          (variant.totalWeightKg ?? 0) + weightInfo.totalKg
      }
    }
  }

  return [...byProduct.values()]
    .map((row) => ({
      productId: row.productId,
      productName: row.productName,
      totalBoxes: row.totalBoxes,
      totalWeightKg: row.hasWeight ? row.totalWeightKg : null,
      variants: [...row.variants.values()]
        .map((v) => ({
          ...v,
          totalWeightKg: v.totalWeightKg != null && v.totalWeightKg > 0
            ? v.totalWeightKg
            : null,
        }))
        .sort((a, b) => {
          const aw = a.weightPerBox ?? 0
          const bw = b.weightPerBox ?? 0
          return aw - bw || a.sizeLabel.localeCompare(b.sizeLabel)
        }),
    }))
    .sort((a, b) => a.productName.localeCompare(b.productName))
}

function csvCell(value: string | number): string {
  const text = String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function exportProductVolumeCsv(rows: ProductVolumeSummary[]): string {
  const header = [
    'Product',
    'Box size',
    'Boxes sold',
    'Weight per box (kg)',
    'Total weight (kg)',
    'Product total boxes',
    'Product total weight (kg)',
  ]

  const lines: string[] = [header.join(',')]

  for (const row of rows) {
    for (const variant of row.variants) {
      lines.push(
        [
          row.productName,
          variant.sizeLabel,
          variant.boxesSold,
          variant.weightPerBox ?? '',
          variant.totalWeightKg ?? '',
          row.totalBoxes,
          row.totalWeightKg ?? '',
        ]
          .map(csvCell)
          .join(','),
      )
    }
  }

  return lines.join('\n')
}

export function downloadProductVolumeCsv(
  rows: ProductVolumeSummary[],
  filenameStem: string,
): void {
  const csv = exportProductVolumeCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenameStem}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function formatWeightKg(totalKg: number | null): string {
  if (totalKg == null) return '—'
  const rounded =
    Math.abs(totalKg - Math.round(totalKg)) < 0.001
      ? String(Math.round(totalKg))
      : totalKg.toFixed(2).replace(/\.?0+$/, '')
  return `${rounded} kg`
}
