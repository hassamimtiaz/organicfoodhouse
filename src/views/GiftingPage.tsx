'use client'

import Link from 'next/link'
import Breadcrumbs from '../components/Breadcrumbs'
import { GIFTING, giftingWhatsAppLink } from '../config/gifting'
import { SITE } from '../config/site'
import './GiftingPage.css'

export default function GiftingPage() {
  return (
    <div className="gifting-page">
      <section className="gifting-hero">
        <div className="container gifting-hero-inner">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Gift fruit' },
            ]}
          />
          <span className="gifting-hero-eyebrow">Host gifts</span>
          <h1>{GIFTING.headline}</h1>
          <p>{GIFTING.subheadline}</p>
          <p className="gifting-hero-tagline">{GIFTING.tagline}</p>
          <div className="gifting-hero-actions">
            <Link href="/category/fruits/mangoes" className="btn btn-primary">
              Shop mango gifts
            </Link>
            <a
              href={giftingWhatsAppLink()}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp for gift orders
            </a>
          </div>
        </div>
      </section>

      <section className="section gifting-compare">
        <div className="container">
          <div className="section-header">
            <h2>A thoughtful alternative</h2>
            <p>
              Same respect as mithai or cake — but fresh, shareable, and from
              farms we trust in Rahim Yar Khan and Multan.
            </p>
          </div>
          <ul className="gifting-compare-grid">
            {GIFTING.compare.map((item) => (
              <li key={item.instead} className="gifting-compare-card">
                <div>
                  <span className="gifting-compare-label">Instead of</span>
                  <strong>{item.instead}</strong>
                </div>
                <div className="gifting-compare-bring">
                  <span className="gifting-compare-label">Bring</span>
                  <strong>{item.bring}</strong>
                </div>
                <p>{item.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section gifting-packaging">
        <div className="container">
          <div className="section-header">
            <h2>Boxes &amp; buckets, ready to gift</h2>
            <p>Choose the presentation that fits the visit — we pack every order with care.</p>
          </div>
          <ul className="gifting-packaging-grid">
            {GIFTING.packaging.map((item) => (
              <li key={item.title} className="gifting-packaging-card">
                <img src={item.image} alt={item.title} loading="lazy" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section gifting-occasions">
        <div className="container">
          <div className="section-header">
            <h2>Perfect when you&apos;re visiting</h2>
          </div>
          <ul className="gifting-occasions-grid">
            {GIFTING.occasions.map((item) => (
              <li key={item.title} className="gifting-occasion-card">
                <span aria-hidden="true">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section gifting-reasons">
        <div className="container gifting-reasons-inner">
          <div>
            <h2>Why families choose fruit gifts</h2>
            <ul className="gifting-reasons-list">
              {GIFTING.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <aside className="gifting-tip-card">
            <h3>Ordering as a gift?</h3>
            <p>
              Add a note at checkout — e.g. &ldquo;Visiting Aunt Sara — please
              pack as gift&rdquo; — or message us on WhatsApp with the occasion
              and we&apos;ll help you pick the right box or basket.
            </p>
            <a
              href={giftingWhatsAppLink()}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
          </aside>
        </div>
      </section>

      <section className="section gifting-cta">
        <div className="container gifting-cta-inner">
          <h2>Ready for your next visit?</h2>
          <p>
            Browse in-season mangoes, pick a gift box size on each product, or
            tell us what you need — we&apos;ll pack it beautifully.
          </p>
          <div className="gifting-hero-actions">
            <Link href="/category/fruits/mangoes" className="btn btn-primary">
              Shop mangoes
            </Link>
            <Link href="/" className="btn btn-outline">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
