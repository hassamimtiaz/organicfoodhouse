import { Link, Outlet } from 'react-router-dom'
import { SITE, whatsappLink } from '../config/site'
import { useCart } from '../contexts/CartContext'
import { isSupabaseConfigured } from '../lib/supabase'
import NavProducts from './NavProducts'
import NewsHighlights from './NewsHighlights'
import SiteLogo from './SiteLogo'
import './Layout.css'

function CartIcon() {
  return (
    <svg
      className="header-cart-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14h9.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021.05 5H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.26-.25L7.16 14z"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      className="header-whatsapp-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  )
}

export default function Layout() {
  const { itemCount } = useCart()

  return (
    <div className="app">
      <NewsHighlights />

      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label={`${SITE.name} — home`}>
            <SiteLogo />
          </Link>

          <nav className="nav" aria-label="Main">
            <Link to="/">Home</Link>
            <NavProducts />
            <Link to="/about-us">About us</Link>
            <Link to="/our-values">Our values</Link>
          </nav>

          <div className="header-actions">
            <Link to="/cart" className="header-cart-btn" aria-label={`Cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}>
              <CartIcon />
              Cart
              {itemCount > 0 && (
                <span className="header-cart-count" aria-hidden="true">
                  {itemCount}
                </span>
              )}
            </Link>

            <a
              href={whatsappLink()}
              className="header-whatsapp-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
          </div>
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
            </ul>
          </div>
          <div className="footer-col">
            <h4>About</h4>
            <ul className="footer-links">
              <li>
                <Link to="/about-us">About us</Link>
              </li>
              <li>
                <Link to="/our-values">Our values</Link>
              </li>
            </ul>
            <p className="footer-note">
              Mango lovers bringing farm-fresh quality from Rahim Yar Khan to your
              home. Pre-order early for the best selection.
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
