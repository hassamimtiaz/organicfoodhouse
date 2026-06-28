import { hasProductDiscount } from '../config/pricing'
import {
  allowsAdvanceOrderWhenOutOfStock,
  formatDeliveryStartLabel,
  getAdvanceOrderLabel,
  getCountdownTarget,
  getSoldOutMode,
  isComingSoonProduct,
  isPreorderCountdownActive,
  isProductOrderable,
} from '../config/preorder'
import type { Product } from '../types'
import DeliveryCountdown from './DeliveryCountdown'
import './PreorderStatus.css'

interface PreorderStatusProps {
  product: Product
  variant?: 'detail' | 'card'
}

export default function PreorderStatus({
  product,
  variant = 'detail',
}: PreorderStatusProps) {
  const comingSoon = isComingSoonProduct(product)
  const advanceWhenOut = allowsAdvanceOrderWhenOutOfStock(product)
  const countdownActive = isPreorderCountdownActive(product)
  const target = getCountdownTarget(product)
  const orderable = isProductOrderable(product)

  if (!comingSoon && !advanceWhenOut && !countdownActive) return null

  const deliveryLabel = product.delivery_starts_at
    ? formatDeliveryStartLabel(product.delivery_starts_at)
    : undefined

  const advanceLabel = getAdvanceOrderLabel(product)

  return (
    <div
      className={`preorder-status preorder-status--${variant} ${comingSoon ? 'is-coming-soon' : ''}${advanceWhenOut ? ' is-advance-order' : ''}`}
    >
      {(comingSoon || advanceWhenOut) && (
        <div className="preorder-status-badges">
          {comingSoon && (
            <span className="preorder-badge preorder-badge--soon">Coming soon</span>
          )}
          {advanceWhenOut && !product.in_stock && (
            <span className="preorder-badge preorder-badge--out">
              Out of stock
            </span>
          )}
          {orderable && (
            <span className="preorder-badge preorder-badge--open">
              {advanceLabel} open
            </span>
          )}
        </div>
      )}

      {variant === 'detail' && (
        <p className="preorder-status-lead">
          {comingSoon ? (
            <>
              <strong>{product.name}</strong> is available to pre-order now.
              Deliveries begin from{' '}
              {deliveryLabel ?? 'the date below'}
              {hasProductDiscount(product)
                ? ` — save ${product.discount_percent}% when you pre-order.`
                : ' — pre-order discounts apply on this item.'}
            </>
          ) : advanceWhenOut ? (
            <>
              <strong>{product.name}</strong> is temporarily out of stock, but
              you can place a{' '}
              {getSoldOutMode(product) === 'restock'
                ? 'restock order'
                : 'pre-order'}{' '}
              now — we&apos;ll confirm delivery when your order is ready.
            </>
          ) : null}
        </p>
      )}

      {countdownActive && target && (
        <DeliveryCountdown
          target={target}
          deliveryDateLabel={deliveryLabel}
          compact={variant === 'card'}
        />
      )}

      {variant === 'card' && comingSoon && product.delivery_starts_at && (
        <p className="preorder-status-card-date">
          Delivery from {formatDeliveryStartLabel(product.delivery_starts_at)}
        </p>
      )}

      {variant === 'card' && advanceWhenOut && !comingSoon && (
        <p className="preorder-status-card-date">{advanceLabel} available</p>
      )}
    </div>
  )
}
