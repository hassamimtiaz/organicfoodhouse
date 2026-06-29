import { useEffect, useState } from 'react'
import {
  getCountdownParts,
  type CountdownParts,
} from '../config/preorder'
import './DeliveryCountdown.css'

interface DeliveryCountdownProps {
  target: Date
  deliveryDateLabel?: string
  compact?: boolean
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function DeliveryCountdown({
  target,
  deliveryDateLabel,
  compact = false,
}: DeliveryCountdownProps) {
  const [mounted, setMounted] = useState(false)
  const [parts, setParts] = useState<CountdownParts>(() =>
    getCountdownParts(target),
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const tick = () => setParts(getCountdownParts(target))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [mounted, target])

  if (!mounted) {
    return (
      <div
        className={`delivery-countdown ${compact ? 'is-compact' : ''}`}
        aria-hidden="true"
      />
    )
  }

  if (parts.expired) {
    return (
      <p className={`delivery-countdown delivery-countdown--started ${compact ? 'is-compact' : ''}`}>
        Deliveries have started — we will contact you to confirm your slot.
      </p>
    )
  }

  const label = deliveryDateLabel ?? ''

  return (
    <div
      className={`delivery-countdown ${compact ? 'is-compact' : ''}`}
      role="timer"
      aria-live="polite"
      aria-label={`Delivery starts ${label}`}
    >
      <p className="delivery-countdown-label">
        Delivery starts <strong>{label}</strong>
      </p>
      <div className="delivery-countdown-grid">
        <div className="countdown-unit">
          <span className="countdown-value">{parts.days}</span>
          <span className="countdown-name">Days</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{pad(parts.hours)}</span>
          <span className="countdown-name">Hours</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{pad(parts.minutes)}</span>
          <span className="countdown-name">Min</span>
        </div>
        <div className="countdown-unit">
          <span className="countdown-value">{pad(parts.seconds)}</span>
          <span className="countdown-name">Sec</span>
        </div>
      </div>
    </div>
  )
}
