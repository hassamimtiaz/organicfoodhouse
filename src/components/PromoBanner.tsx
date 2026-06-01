import { Link } from 'react-router-dom'
import { SITE } from '../config/site'
import './PromoBanner.css'

export default function PromoBanner() {
  return (
    <section className="promo-banner" aria-label="Pre-order offer">
      <div className="container promo-banner-inner">
        <div className="promo-banner-text">
          <p className="promo-eyebrow">Seasonal pre-order</p>
          <h2>
            Pre-order in-season produce — get{' '}
            <strong>{SITE.preOrderDiscount} off</strong>
          </h2>
          <p>
            Skip the market rush. Reserve carbide-free, farm-fresh items while
            they&apos;re available. Delivering across {SITE.deliveryArea}.
          </p>
          <div className="promo-actions">
            <Link to="/#in-season" className="btn btn-promo">
              Shop seasonal picks →
            </Link>
            <Link to="/category/fruits" className="btn btn-promo-outline">
              Browse categories
            </Link>
          </div>
        </div>
        <div className="promo-banner-visual" aria-hidden="true">
          <div className="promo-mango-stack">🌿</div>
          <span className="promo-farm-tag">100% organic</span>
        </div>
      </div>
    </section>
  )
}
