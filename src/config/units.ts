import type { Product } from '../types'

type UnitFields = Pick<Product, 'unit' | 'unit_min' | 'unit_max'>

/** e.g. "kg" or "9 – 10 kg" */
export function formatUnitLabel(product: UnitFields): string {
  const measure = product.unit.trim()
  const min = product.unit_min
  const max = product.unit_max

  if (min != null && max != null && max >= min) {
    const minStr = formatUnitNumber(min)
    const maxStr = formatUnitNumber(max)
    return minStr === maxStr ? `${minStr} ${measure}` : `${minStr} – ${maxStr} ${measure}`
  }

  return measure
}

function formatUnitNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value)
}

export function hasUnitRange(product: UnitFields): boolean {
  return (
    product.unit_min != null &&
    product.unit_max != null &&
    product.unit_max >= product.unit_min
  )
}
