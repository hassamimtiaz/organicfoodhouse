import { SITE } from '../config/site'
import {
  acceptsPreorder,
  formatDeliveryStartLabel,
  getCountdownTarget,
  isComingSoonProduct,
  isPreorderCountdownActive,
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
  const countdownActive = isPreorderCountdownActive(product)
  const target = getCountdownTarget(product)
  const canPreorder = acceptsPreorder(product)

  if (!comingSoon && !countdownActive) return null

  const deliveryLabel = product.delivery_starts_at
    ? formatDeliveryStartLabel(product.delivery_starts_at)
    : undefined

  return (
    <div
      className={`preorder-status preorder-status--${variant} ${comingSoon ? 'is-coming-soon' : ''}`}
    >
      {comingSoon && (
        <div className="preorder-status-badges">
          <span className="preorder-badge preorder-badge--soon">Coming soon</span>
          {canPreorder && (
            <span className="preorder-badge preorder-badge--open">
              Pre-order open
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
              {deliveryLabel ?? 'the date below'} — save {SITE.preOrderDiscount}{' '}
              when you order early.
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
    </div>
  )
}
