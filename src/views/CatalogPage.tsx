'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import Seo from '../components/Seo'
import { CATALOG, catalogWhatsAppLink } from '../config/catalog'
import { formatPackagingLabel, hasPackagings } from '../config/packaging'
import { SITE, whatsappLink } from '../config/site'
import { fetchTopLevelCategories, fetchVisibleProducts } from '../services/api'
import { IMAGE_SIZES } from '../lib/imageSizes'
import { getProductUrl } from '../lib/productSlug'
import SiteImage from '../components/SiteImage'
import type { Category, Product } from '../types'
import './CatalogPage.css'

function presentationTagClass(tag: keyof typeof CATALOG.tagLabels) {
  return `catalog-tag catalog-tag--${tag}`
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [items, cats] = await Promise.all([
          fetchVisibleProducts(),
          fetchTopLevelCategories(),
        ])
        setProducts(items)
        setCategories(cats)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="catalog-page">
      <Seo
        title="Catalog — boxes, baskets & seasonal fruit"
        description={`Browse ${SITE.name} catalog — premium mango gift boxes, gift baskets, protected delivery packing, and organic varieties from Rahim Yar Khan & Multan.`}
        path="/catalog"
        keywords="organic fruit catalog Pakistan, mango gift box catalog, fruit basket Lahore, mango packaging Organic Fruit House"
      />

      <section className="catalog-hero">
        <div className="container catalog-hero-inner">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Catalog' },
            ]}
          />
          <span className="catalog-hero-eyebrow">{CATALOG.hero.eyebrow}</span>
          <h1>{CATALOG.hero.title}</h1>
          <p>{CATALOG.hero.subtitle}</p>
          <div className="catalog-hero-actions">
            <Link href="/category/fruits/mangoes" className="btn btn-primary">
              Shop mangoes
            </Link>
            <Link href="/gifting" className="btn btn-outline">
              Gift fruit guide
            </Link>
          </div>
        </div>
      </section>

      <section className="section catalog-presentation">
        <div className="container">
          <div className="section-header">
            <h2>Packaging &amp; presentation</h2>
            <p>
              How we pack your order — from everyday delivery boxes to gift-ready
              buckets and baskets.
            </p>
          </div>
          <ul className="catalog-grid">
            {CATALOG.presentation.map((item, index) => (
              <li key={item.id} className="catalog-card">
                <div className="catalog-card-image">
                  <SiteImage
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes={IMAGE_SIZES.catalogPresentation}
                    priority={index === 0}
                    className="catalog-card-cover"
                  />
                  <span className={presentationTagClass(item.tag)}>
                    {CATALOG.tagLabels[item.tag]}
                  </span>
                </div>
                <div className="catalog-card-body">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p className="catalog-card-note">
                    <strong>How to order:</strong> {item.orderNote}
                  </p>
                  <a
                    href={catalogWhatsAppLink(item.title)}
                    className="catalog-card-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ask on WhatsApp →
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-alt catalog-products">
        <div className="container">
          <div className="section-header">
            <h2>Seasonal fruit varieties</h2>
            <p>
              Organic mangoes and more — each listing shows box sizes and prices
              when you open the product.
            </p>
          </div>

          {categories.length > 0 && (
            <div className="catalog-category-links">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="catalog-category-pill"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {loading ? (
            <p className="status-msg">Loading catalog…</p>
          ) : products.length === 0 ? (
            <p className="status-msg">New seasonal items coming soon.</p>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <ul className="catalog-product-list">
                {products.map((product) => (
                  <li key={product.id} className="catalog-product-row">
                    <div>
                      <Link href={getProductUrl(product)} className="catalog-product-name">
                        {product.name}
                      </Link>
                      {product.description && (
                        <p>{product.description}</p>
                      )}
                    </div>
                    {hasPackagings(product) && (
                      <ul className="catalog-packaging-list">
                        {product.packagings!.map((packaging) => (
                          <li key={packaging.id}>
                            {formatPackagingLabel(packaging)}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={getProductUrl(product)} className="btn btn-outline btn-sm">
                      View &amp; order
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="section catalog-order-help">
        <div className="container catalog-order-help-inner">
          <div>
            <h2>How to order from the catalog</h2>
            <ol className="catalog-order-steps">
              <li>
                <strong>Online</strong> — pick a variety, choose your box size,
                add to cart, and checkout. Add gift notes if needed.
              </li>
              <li>
                <strong>WhatsApp</strong> — best for gift baskets and custom
                packing. Send a photo from this catalog if helpful.
              </li>
              <li>
                <strong>Phone</strong> — call {SITE.phone} and we&apos;ll guide
                you through options.
              </li>
            </ol>
          </div>
          <aside className="catalog-order-card">
            <h3>Not sure which box or basket?</h3>
            <p>
              Tell us the occasion — home visit, Eid, housewarming — and
              we&apos;ll recommend the right packaging.
            </p>
            <a
              href={whatsappLink()}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
            <Link href="/gifting" className="catalog-order-secondary">
              Read our gift fruit guide →
            </Link>
          </aside>
        </div>
      </section>
    </div>
  )
}
