import { Link, Outlet } from 'react-router-dom'
import { DELIVERY_CHARGES_SHORT } from '../config/delivery'
import { SITE, whatsappLink } from '../config/site'
import DeliveryNotice from './DeliveryNotice'
import { isSupabaseConfigured } from '../lib/supabase'
import NavProducts from './NavProducts'
import ProductSearch from './ProductSearch'
import './Layout.css'

export default function Layout() {
  return (
    <div className="app">
      <div className="contact-bar">
        <div className="container contact-bar-inner">
          <div className="contact-items">
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a>
            <span className="contact-delivery">
              🚚 Delivering across {SITE.deliveryArea}
            </span>
            <span className="contact-delivery-charges">{DELIVERY_CHARGES_SHORT}</span>
          </div>
          <div className="contact-actions">
            <a
              href={whatsappLink()}
              className="btn-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-icon" aria-hidden="true">
              🌿
            </span>
            <span>
              {SITE.name}
              <small>{SITE.tagline}</small>
            </span>
          </Link>

          <nav className="nav" aria-label="Main">
            <Link to="/">Home</Link>
            <NavProducts />
          </nav>

          <ProductSearch variant="header" />
        </div>

        {!isSupabaseConfigured && (
          <div className="banner-demo">
            <div className="container">
              Demo mode — add Supabase keys in <code>.env</code> and run{' '}
              <code>supabase/schema.sql</code>
            </div>
          </div>
        )}
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <h3>{SITE.name}</h3>
            <p>
              Your seasonal organic marketplace — farm-fresh fruits and produce
              delivered across {SITE.deliveryArea}. Naturally ripened,
              carbide-free.
            </p>
            <DeliveryNotice compact />
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul className="footer-links">
              <li>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li>
                <a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a>
              </li>
              <li>
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: {SITE.whatsappDisplay}
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            <ul className="footer-links">
              <li>
                <Link to="/category/fruits">Fruits</Link>
              </li>
              <li>
                <Link to="/category/fruits/mangoes">Mangoes (in season)</Link>
              </li>
              <li>
                <Link to="/search">Search products</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Our promise</h4>
            <p className="footer-note">
              We sell what&apos;s in season — quality first, direct from partner
              farms to your home. Pre-order early for the best selection.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>
              © {new Date().getFullYear()} {SITE.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
