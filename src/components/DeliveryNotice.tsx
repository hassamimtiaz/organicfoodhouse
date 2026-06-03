import { DELIVERY_CHARGES_NOTE, deliveryNoteForCity } from '../config/delivery'
import './DeliveryNotice.css'

interface DeliveryNoticeProps {
  city?: string
  compact?: boolean
}

export default function DeliveryNotice({ city, compact = false }: DeliveryNoticeProps) {
  const text = city?.trim() ? deliveryNoteForCity(city) : DELIVERY_CHARGES_NOTE

  return (
    <aside
      className={`delivery-notice ${compact ? 'delivery-notice--compact' : ''}`}
      role="note"
    >
      <span className="delivery-notice-icon" aria-hidden="true">
        🚚
      </span>
      <p>{text}</p>
    </aside>
  )
}
