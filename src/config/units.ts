import type { Product } from '../types'

type UnitFields = Pick<Product, 'unit' | 'unit_min' | 'unit_max'>

function formatMeasure(unit: string, titleCase?: boolean): string {
  const trimmed = unit.trim()
  if (!titleCase) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

/** e.g. "kg" or "~ 10 kg" for a size range */
export function formatUnitLabel(
  product: UnitFields,
  options?: { titleCaseMeasure?: boolean },
): string {
  const measure = formatMeasure(product.unit, options?.titleCaseMeasure)
  const min = product.unit_min
  const max = product.unit_max

  if (min != null && max != null && max >= min) {
    const maxStr = formatUnitNumber(max)
    return min === max ? `${maxStr} ${measure}` : `~ ${maxStr} ${measure}`
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

/** Label for the separate unit/weight row in product pricing UI */
export function getUnitRowLabel(product: UnitFields): string {
  return hasUnitRange(product) ? 'Weight' : 'Unit'
}
