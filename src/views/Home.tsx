'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import HomeFaq from '../components/HomeFaq'
import HostGiftSection from '../components/HostGiftSection'
import HeroSlider from '../components/HeroSlider'
import MangoSeoContent from '../components/MangoSeoContent'
import TrustBadges from '../components/TrustBadges'
import ProductCard from '../components/ProductCard'
import { SITE, whatsappLink } from '../config/site'
import { fetchVisibleProducts } from '../services/api'
import type { Product } from '../types'
import './Home.css'

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const all = await fetchVisibleProducts()
        setFeatured(all.slice(0, 8))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      <HeroSlider />

      <section className="home-intro">
        <div className="container home-intro-inner">
          <div>
            <h1>Buy mangoes online in Lahore &amp; all over Pakistan</h1>
            <p>
              {SITE.name} delivers carbide-free organic mangoes and seasonal
              fruit nationwide — from Lahore to Karachi, Islamabad, and beyond.
              Pre-order Chaunsa, Sindhri, Dasheri, and Anwar Ratol online or on
              WhatsApp; farm-fresh from Rahim Yar Khan and Multan, packed with
              care for your doorstep.
            </p>
          </div>
          <div className="home-intro-actions">
            <Link href="/category/fruits/mangoes" className="btn btn-primary">
              Shop mangoes
            </Link>
            <a
              href={whatsappLink()}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <TrustBadges />

      <HostGiftSection />

      {/* Seasonal marketplace */}

      <section className="section section-alt" id="in-season">
        <div className="container">
          <div className="section-header">
            <h2>In season now</h2>
            <p>Hand-picked organic items available to order today</p>
          </div>
          {loading ? (
            <p className="status-msg">Loading products…</p>
          ) : featured.length === 0 ? (
            <p className="status-msg">New seasonal products coming soon.</p>
          ) : (
            <div className="product-grid">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {/* <div className="section-cta">
            <Link href="/category/fruits" className="btn btn-outline">
              View all products →
            </Link>
          </div> */}
        </div>
      </section>

      <section className="section home-why">
        <div className="container home-why-inner">
          <div className="home-why-text">
            <h2>Why shop with {SITE.name}?</h2>
            <p>
              We work directly with trusted growers — no long warehouse storage.
              What you order is picked for ripeness and packed with care, whether
              it&apos;s mangoes in summer or the next seasonal favourite.
            </p>
            <ul className="home-why-list">
              <li>100% organic, carbide-free ripening</li>
              <li>Farm-to-home delivery across {SITE.deliveryArea}</li>
              <li>Pre-order discounts on seasonal items</li>
              <li>
                Free delivery on product totals above {SITE.freeShippingMin}{' '}
                (delivery charges still based on your address where applicable)
              </li>
            </ul>
          </div>
          <div className="home-help-card">
            <h3>Need help ordering?</h3>
            <p>Our team is happy to guide you — call or WhatsApp.</p>
            <a className="home-contact-link" href={`tel:${SITE.phoneTel}`}>
              {SITE.phone}
            </a>
            <a
              href={whatsappLink()}
              className="btn btn-primary btn-whatsapp-card"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <MangoSeoContent variant="home" />

      <HomeFaq />

      <section className="section cta-final">
        <div className="container cta-final-inner">
          <h2>Don&apos;t miss this season&apos;s harvest</h2>
          <p>Pre-order today — limited stock. Discounts shown on each product.</p>
          <div className="home-intro-actions">
            <Link href="/category/fruits" className="btn btn-primary">
              Start shopping
            </Link>
            <a
              href={`tel:${SITE.phoneTel}`}
              className="btn btn-outline cta-call"
            >
              Call {SITE.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
