import { useRef, type TouchEventHandler } from 'react'

export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  minDistance = 48,
): {
  onTouchStart: TouchEventHandler
  onTouchEnd: TouchEventHandler
} {
  const touchStartX = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const endX = e.changedTouches[0]?.clientX
    if (endX == null) return
    const diff = endX - touchStartX.current
    if (Math.abs(diff) >= minDistance) {
      if (diff < 0) onSwipeLeft()
      else onSwipeRight()
    }
    touchStartX.current = null
  }

  return { onTouchStart, onTouchEnd }
}
