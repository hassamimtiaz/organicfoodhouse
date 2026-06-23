import type { CartLine } from '../types'

export function getCartLineKey(
  line: Pick<CartLine, 'product' | 'packaging_id'>,
): string {
  return `${line.product.id}:${line.packaging_id ?? ''}`
}
