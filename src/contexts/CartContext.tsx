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
  addItem: (product: Product, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => loadCartFromStorage())

  useEffect(() => {
    saveCartToStorage(items)
  }, [items])

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (!product.in_stock) return

    const addQty = clampPackQuantity(quantity)
    setItems((prev) => {
      const existing = prev.find((line) => line.product.id === product.id)
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? {
                product,
                quantity: clampPackQuantity(line.quantity + addQty),
              }
            : line,
        )
      }
      return [...prev, { product, quantity: addQty }]
    })
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const qty = clampPackQuantity(quantity)
    setItems((prev) =>
      prev.map((line) =>
        line.product.id === productId ? { ...line, quantity: qty } : line,
      ),
    )
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((line) => line.product.id !== productId))
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
