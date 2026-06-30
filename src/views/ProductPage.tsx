'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AddToCartButton from '../components/AddToCartButton'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductGridSection from '../components/ProductGridSection'
import ProductGallery from '../components/ProductGallery'
import PreorderStatus from '../components/PreorderStatus'
import ProductDetailPricing from '../components/ProductDetailPricing'
import DeliveryNotice from '../components/DeliveryNotice'
import {
  allowsAdvanceOrderWhenOutOfStock,
  getAddToCartLabel,
  isComingSoonProduct,
  isPreorderOrder,
  isProductOrderable,
} from '../config/preorder'
import { hasProductDiscount } from '../config/pricing'
import { getDefaultPackaging, getPackagingById, getPackagingPriceRange, getPackagingUnitPrice, hasPackagings } from '../config/packaging'
import { formatPricePKR } from '../config/site'
import { isPackagingSelectable } from '../lib/packagingStock'
import { getProductImageUrls } from '../config/productImages'
import { SITE, whatsappLink } from '../config/site'
import { saveDirectCheckout } from '../lib/checkoutStorage'
import { fetchProductRecommendations } from '../services/api'
import { getProductUrl } from '../lib/productSlug'
import {
  fetchProductBySlugOrId,
  getProductCategoryPath,
} from '../services/ordersApi'
import type { Product } from '../types'
import './ProductPage.css'

function slugToLabel(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function getMobileBarSummary(
  product: Product,
  selectedPackagingId: string | null,
): { price: string; label: string | null } {
  if (hasPackagings(product)) {
    if (selectedPackagingId) {
      const packaging = getPackagingById(product, selectedPackagingId)
      if (packaging) {
        return {
          price: formatPricePKR(getPackagingUnitPrice(product, packaging)),
          label: packaging.label.trim(),
        }
      }
    }
    const range = getPackagingPriceRange(product)
    if (range) {
      return {
        price:
          range.min === range.max
            ? formatPricePKR(range.min)
            : `From ${formatPricePKR(range.min)}`,
        label: 'Select a box size',
      }
    }
  }

  return {
    price: formatPricePKR(Number(product.price)),
    label: null,
  }
}

export default function ProductPage({ slug: urlRef }: { slug: string }) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [categoryPath, setCategoryPath] = useState<{
    parentSlug: string
    subSlug: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [alsoLikeProducts, setAlsoLikeProducts] = useState<Product[]>([])
  const [selectedPackagingId, setSelectedPackagingId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (!product || !hasPackagings(product)) {
      setSelectedPackagingId(null)
      return
    }
    const fallback = getDefaultPackaging(product)
    setSelectedPackagingId((current) => {
      if (
        current &&
        product.packagings?.some(
          (p) => p.id === current && isPackagingSelectable(product, p),
        )
      ) {
        return current
      }
      return fallback?.id ?? null
    })
  }, [product])

  useEffect(() => {
    if (!urlRef) return

    const ref = urlRef

    async function load() {
      setLoading(true)
      setError(null)
      setRelatedProducts([])
      setAlsoLikeProducts([])
      try {
        const p = await fetchProductBySlugOrId(ref)
        if (!p) {
          setError('Product not found')
          return
        }
        setProduct(p)
        if (urlRef !== p.slug) {
          window.history.replaceState(null, '', getProductUrl(p))
        }
        const path = await getProductCategoryPath(p)
        setCategoryPath(path)

        const { related, alsoLike } = await fetchProductRecommendations(p)
        setRelatedProducts(related)
        setAlsoLikeProducts(alsoLike)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [urlRef])

  const comingSoon = product ? isComingSoonProduct(product) : false
  const advanceWhenOut = product ? allowsAdvanceOrderWhenOutOfStock(product) : false
  const isPreorderFlow = product ? isPreorderOrder(product) : false
  const orderable = product ? isProductOrderable(product) : false

  useEffect(() => {
    if (!orderable) {
      document.body.classList.remove('has-mobile-buy-bar')
      return
    }

    const mq = window.matchMedia('(max-width: 768px)')
    const sync = () => {
      document.body.classList.toggle('has-mobile-buy-bar', mq.matches)
    }

    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      document.body.classList.remove('has-mobile-buy-bar')
    }
  }, [orderable])

  const detailBadge = product
    ? advanceWhenOut
      ? product.sold_out_mode === 'restock'
        ? 'Restock order open'
        : 'Pre-order open'
      : comingSoon
        ? 'Coming soon · Pre-order open'
        : hasProductDiscount(product)
          ? `${product.discount_percent}% OFF`
          : null
    : null

  const whatsappMsg = product
    ? isPreorderFlow
      ? `Hi! I want to pre-order ${product.name} from ${SITE.name}.`
      : `Hi! I want to order ${product.name} from ${SITE.name}.`
    : ''

  function handleBuyNow() {
    if (!product) return
    if (hasPackagings(product) && !selectedPackagingId) return
    saveDirectCheckout([
      {
        productId: product.id,
        packagingId: selectedPackagingId,
        quantity: 1,
      },
    ])
    router.push('/order')
  }

  if (loading) {
    return (
      <div className="product-page">
        <div className="container">
          <p className="status-msg">Loading product…</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-page">
        <div className="container">
          <p className="status-msg error">{error ?? 'Product not found'}</p>
          <Link href="/" className="btn btn-primary">
            Back to shop
          </Link>
        </div>
      </div>
    )
  }

  const breadcrumbItems = [
    { label: 'Shop', to: '/' },
    ...(categoryPath
      ? [
          {
            label: slugToLabel(categoryPath.parentSlug),
            to: `/category/${categoryPath.parentSlug}`,
          },
          {
            label: slugToLabel(categoryPath.subSlug),
            to: `/category/${categoryPath.parentSlug}/${categoryPath.subSlug}`,
          },
        ]
      : []),
    { label: product.name },
  ]

  const subcategoryLabel = categoryPath
    ? slugToLabel(categoryPath.subSlug)
    : null

  const recommendations =
    relatedProducts.length > 0 || alsoLikeProducts.length > 0 ? (
      <div className="product-recommendations">
        <ProductGridSection
          title="Related products"
          description={
            subcategoryLabel
              ? `More varieties from ${subcategoryLabel} you might enjoy.`
              : 'More items from this collection.'
          }
          products={relatedProducts}
          viewAll={
            categoryPath
              ? {
                  label: `View all ${subcategoryLabel ?? 'products'}`,
                  to: `/category/${categoryPath.parentSlug}/${categoryPath.subSlug}`,
                }
              : undefined
          }
        />
        <ProductGridSection
          title="You may also like"
          description="Other seasonal picks from our catalog."
          products={alsoLikeProducts}
          viewAll={
            categoryPath
              ? {
                  label: `Browse ${slugToLabel(categoryPath.parentSlug)}`,
                  to: `/category/${categoryPath.parentSlug}`,
                }
              : { label: 'Browse shop', to: '/' }
          }
        />
      </div>
    ) : null

  const mobileBarSummary = getMobileBarSummary(product, selectedPackagingId)

  return (
    <div className="product-page">
      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="product-detail-grid">
          <ProductGallery
            images={getProductImageUrls(product)}
            alt={product.name}
            fallbackEmoji={
              product.name.toLowerCase().includes('mango') ? '🥭' : '🍎'
            }
            badge={detailBadge}
            badgeVariant={comingSoon ? 'soon' : 'default'}
          />

          <div className="product-detail-info">
            <p className="product-detail-origin">
              Organic · Seasonal · {SITE.deliveryArea}
            </p>
            <h1>{product.name}</h1>
            {product.description && (
              <p className="product-detail-desc">{product.description}</p>
            )}

            <PreorderStatus product={product} variant="detail" />

            <div className="product-detail-price-box">
              <ProductDetailPricing
                product={product}
                selectedPackagingId={selectedPackagingId}
                onPackagingChange={setSelectedPackagingId}
              />
            </div>

            <DeliveryNotice compact />

            {orderable && (
              <div className="product-order-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleBuyNow}
                  disabled={hasPackagings(product) && !selectedPackagingId}
                >
                  {isPreorderFlow ? `${getAddToCartLabel(product)} now` : 'Buy now'}
                </button>
                <AddToCartButton
                  product={product}
                  packagingId={selectedPackagingId}
                  variant="outline"
                  disabled={hasPackagings(product) && !selectedPackagingId}
                />
                <a
                  href={whatsappLink(whatsappMsg)}
                  className="btn btn-outline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {isPreorderFlow
                    ? 'Pre-order on WhatsApp'
                    : 'Order on WhatsApp'}
                </a>
                <a
                  href={`tel:${SITE.phoneTel}`}
                  className="btn btn-outline"
                >
                  Call for inquiry — {SITE.phone}
                </a>
              </div>
            )}

            {!orderable && (
              <p className="out-stock-label product-out-stock-block">
                Currently unavailable — contact us for availability.
              </p>
            )}
          </div>
        </div>

        {recommendations}
      </div>

      {orderable && (
        <div className="product-mobile-bar" aria-label="Quick order">
          <div className="product-mobile-bar-summary">
            <span className="product-mobile-bar-amount">
              {mobileBarSummary.price}
            </span>
            {mobileBarSummary.label && (
              <span className="product-mobile-bar-label">
                {mobileBarSummary.label}
              </span>
            )}
          </div>
          <div className="product-mobile-bar-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBuyNow}
              disabled={hasPackagings(product) && !selectedPackagingId}
            >
              {isPreorderFlow ? `${getAddToCartLabel(product)} now` : 'Buy now'}
            </button>
            <AddToCartButton
              product={product}
              packagingId={selectedPackagingId}
              variant="outline"
              size="sm"
              disabled={hasPackagings(product) && !selectedPackagingId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
