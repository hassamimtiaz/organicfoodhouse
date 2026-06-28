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
  getPackagingById,
  hasPackagings,
} from '../config/packaging'
import {
  clampToPackagingStock,
  isPackagingSelectable,
} from '../lib/packagingStock'
import {
  allowsAdvanceOrderWhenOutOfStock,
  isProductOrderable,
} from '../config/preorder'
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
      if (!isProductOrderable(product)) return

      let resolvedPackagingId = packagingId ?? null
      let packaging = null as ReturnType<typeof getPackagingById>
      if (hasPackagings(product)) {
        packaging =
          product.packagings?.find(
            (p) => p.id === resolvedPackagingId && isPackagingSelectable(product, p),
          ) ?? getDefaultPackaging(product)
        if (!packaging || !isPackagingSelectable(product, packaging)) return
        resolvedPackagingId = packaging.id
      } else {
        resolvedPackagingId = null
      }

      const skipStockCap = allowsAdvanceOrderWhenOutOfStock(product)

      const lineKey = getCartLineKey({
        product,
        packaging_id: resolvedPackagingId,
      })

      setItems((prev) => {
        const existing = prev.find(
          (line) => getCartLineKey(line) === lineKey,
        )
        const alreadyInCart = existing?.quantity ?? 0
        let addQty = clampPackQuantity(quantity)
        if (packaging && !skipStockCap) {
          addQty = clampToPackagingStock(
            packaging,
            addQty,
            alreadyInCart,
          )
          if (addQty < 1) return prev
        }

        if (existing) {
          return prev.map((line) =>
            getCartLineKey(line) === lineKey
              ? {
                  product,
                  packaging_id: resolvedPackagingId,
                  quantity: clampPackQuantity(alreadyInCart + addQty),
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
    setItems((prev) =>
      prev.map((line) => {
        if (getCartLineKey(line) !== lineKey) return line
        let qty = clampPackQuantity(quantity)
        if (hasPackagings(line.product) && line.packaging_id) {
          const packaging = getPackagingById(line.product, line.packaging_id)
          if (packaging && !allowsAdvanceOrderWhenOutOfStock(line.product)) {
            qty = clampToPackagingStock(packaging, qty)
          }
        }
        return { ...line, quantity: qty }
      }),
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
    [items, addItem, setQuantity, removeItem],
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
