import { Link } from 'react-router-dom'
import { GIFTING, giftingWhatsAppLink } from '../config/gifting'
import './HostGiftSection.css'

export default function HostGiftSection() {
  return (
    <section className="host-gift" aria-labelledby="host-gift-heading">
      <div className="container host-gift-inner">
        <div className="host-gift-intro">
          <span className="host-gift-eyebrow">Better host gifts</span>
          <h2 id="host-gift-heading">{GIFTING.headline}</h2>
          <p>{GIFTING.subheadline}</p>
          <p className="host-gift-tagline">{GIFTING.tagline}</p>
          <div className="host-gift-actions">
            <Link to="/gifting" className="btn btn-primary">
              Gift boxes &amp; baskets
            </Link>
            <a
              href={giftingWhatsAppLink()}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Order on WhatsApp
            </a>
            <Link to="/catalog" className="btn btn-outline">
              View catalog
            </Link>
          </div>
        </div>

        <ul className="host-gift-compare">
          {GIFTING.compare.map((item) => (
            <li key={item.instead} className="host-gift-compare-card">
              <div className="host-gift-compare-row">
                <span className="host-gift-compare-label">Instead of</span>
                <strong>{item.instead}</strong>
              </div>
              <div className="host-gift-compare-row host-gift-compare-row--bring">
                <span className="host-gift-compare-label">Bring</span>
                <strong>{item.bring}</strong>
              </div>
              <p>{item.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
