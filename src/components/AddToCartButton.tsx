import { useState, type MouseEvent } from 'react'
import { useCart } from '../contexts/CartContext'
import { hasPackagings } from '../config/packaging'
import { getAddToCartLabel, isProductOrderable } from '../config/preorder'
import type { Product } from '../types'
import './AddToCartButton.css'

interface AddToCartButtonProps {
  product: Product
  quantity?: number
  packagingId?: string | null
  size?: 'sm' | 'default'
  variant?: 'primary' | 'outline'
  className?: string
  disabled?: boolean
}

export default function AddToCartButton({
  product,
  quantity = 1,
  packagingId = null,
  size = 'default',
  variant = 'outline',
  className = '',
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  if (!isProductOrderable(product)) return null
  if (hasPackagings(product) && !packagingId) return null

  function handleClick(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    addItem(product, quantity, packagingId)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  const sizeClass = size === 'sm' ? 'btn-sm' : ''
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-outline'
  const label = getAddToCartLabel(product)

  return (
    <button
      type="button"
      className={`btn ${variantClass} ${sizeClass} add-to-cart-btn${added ? ' is-added' : ''} ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled}
      aria-live="polite"
    >
      {added ? 'Added ✓' : label}
    </button>
  )
}
