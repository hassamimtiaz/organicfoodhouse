import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroSlider from '../components/HeroSlider'
import JsonLd from '../components/JsonLd'
import Seo from '../components/Seo'
import TrustBadges from '../components/TrustBadges'
import CategoryCard from '../components/CategoryCard'
import ProductCard from '../components/ProductCard'
import { SITE, whatsappLink } from '../config/site'
import { fetchVisibleProducts, fetchSubcategories, fetchTopLevelCategories } from '../services/api'
import type { Category, Product } from '../types'
import './Home.css'

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategoryCounts, setSubcategoryCounts] = useState<
    Record<string, number>
  >({})
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const cats = await fetchTopLevelCategories()
        setCategories(cats)

        const counts: Record<string, number> = {}
        await Promise.all(
          cats.map(async (cat) => {
            const subs = await fetchSubcategories(cat.id)
            counts[cat.id] = subs.length
          }),
        )
        setSubcategoryCounts(counts)

        const all = await fetchVisibleProducts()
        setFeatured(all.slice(0, 8))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      <Seo
        path="/"
        description={SITE.description}
        keywords="organic food online Pakistan, seasonal fruits, buy organic produce, farm fresh delivery, carbide free fruits, pre order organic"
      />
      <JsonLd />

      <HeroSlider />

      <section className="home-intro">
        <div className="container home-intro-inner">
          <div>
            <span className="home-intro-tag">Seasonal marketplace</span>
            <h1>Fresh organic produce, when it&apos;s in season</h1>
            <p>
              {SITE.name} brings you the best of each harvest — fruits and more as
              seasons change. Pre-order online, chat on WhatsApp, or call us.
              Save {SITE.preOrderDiscount} on pre-orders.
            </p>
          </div>
          <div className="home-intro-actions">
            <Link to="/category/fruits" className="btn btn-primary">
              Browse products
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

      <section className="section section-categories">
        <div className="container">
          <div className="section-header">
            <h2>Shop by category</h2>
            <p>
              Explore what&apos;s available this season — more categories coming
              as harvests arrive
            </p>
          </div>
          {loading ? (
            <p className="status-msg">Loading categories…</p>
          ) : error ? (
            <p className="status-msg error">{error}</p>
          ) : (
            <div className="category-grid">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  subcategoryCount={subcategoryCounts[cat.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

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
          <div className="section-cta">
            <Link to="/category/fruits" className="btn btn-outline">
              View all products →
            </Link>
          </div>
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
              <li>Free delivery on orders above {SITE.freeShippingMin}</li>
            </ul>
          </div>
          <div className="home-help-card">
            <h3>Need help ordering?</h3>
            <p>Our team is happy to guide you — call, email, or WhatsApp.</p>
            <a className="home-contact-link" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
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

      <section className="section cta-final">
        <div className="container cta-final-inner">
          <h2>Don&apos;t miss this season&apos;s harvest</h2>
          <p>Pre-order today and get {SITE.preOrderDiscount} off — limited stock.</p>
          <div className="home-intro-actions">
            <Link to="/category/fruits" className="btn btn-primary">
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
