import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clampPackQuantity,
  loadCartFromStorage,
  saveCartToStorage,
} from '../lib/cartStorage'
import { getCartLineKey } from '../lib/cartLineKey'
import {
  getDefaultPackaging,
  hasPackagings,
} from '../config/packaging'
import {
  cartHasPreorder,
  cartHasPriceRange,
  getCartItemCount,
  getCartSubtotal,
} from '../lib/cartTotals'
import type { CartLine, Product } from '../types'

interface CartContextValue {
  items: CartLine[]
  itemCount: number
  subtotal: number
  hasPriceRange: boolean
  hasPreorder: boolean
  addItem: (product: Product, quantity?: number, packagingId?: string | null) => void
  setQuantity: (lineKey: string, quantity: number) => void
  removeItem: (lineKey: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => loadCartFromStorage())

  useEffect(() => {
    saveCartToStorage(items)
  }, [items])

  const addItem = useCallback(
    (product: Product, quantity = 1, packagingId?: string | null) => {
      if (!product.in_stock) return

      let resolvedPackagingId = packagingId ?? null
      if (hasPackagings(product)) {
        const packaging =
          product.packagings?.find(
            (p) => p.id === resolvedPackagingId && p.in_stock,
          ) ?? getDefaultPackaging(product)
        if (!packaging) return
        resolvedPackagingId = packaging.id
      } else {
        resolvedPackagingId = null
      }

      const addQty = clampPackQuantity(quantity)
      const lineKey = getCartLineKey({
        product,
        packaging_id: resolvedPackagingId,
      })

      setItems((prev) => {
        const existing = prev.find(
          (line) => getCartLineKey(line) === lineKey,
        )
        if (existing) {
          return prev.map((line) =>
            getCartLineKey(line) === lineKey
              ? {
                  product,
                  packaging_id: resolvedPackagingId,
                  quantity: clampPackQuantity(line.quantity + addQty),
                }
              : line,
          )
        }
        return [
          ...prev,
          {
            product,
            packaging_id: resolvedPackagingId,
            quantity: addQty,
          },
        ]
      })
    },
    [],
  )

  const setQuantity = useCallback((lineKey: string, quantity: number) => {
    const qty = clampPackQuantity(quantity)
    setItems((prev) =>
      prev.map((line) =>
        getCartLineKey(line) === lineKey ? { ...line, quantity: qty } : line,
      ),
    )
  }, [])

  const removeItem = useCallback((lineKey: string) => {
    setItems((prev) => prev.filter((line) => getCartLineKey(line) !== lineKey))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount: getCartItemCount(items),
      subtotal: getCartSubtotal(items),
      hasPriceRange: cartHasPriceRange(items),
      hasPreorder: cartHasPreorder(items),
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, addItem, setQuantity, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}
