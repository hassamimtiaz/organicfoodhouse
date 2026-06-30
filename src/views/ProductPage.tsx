'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AddToCartButton from '../components/AddToCartButton'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductGridSection from '../components/ProductGridSection'
import ProductGallery from '../components/ProductGallery'
import PreorderStatus from '../components/PreorderStatus'
import ProductDetailPricing from '../components/ProductDetailPricing'
import DeliveryNotice from '../components/DeliveryNotice'
import ProductPageSkeleton from '../components/skeletons/ProductPageSkeleton'
import ProductGridSkeleton from '../components/skeletons/ProductGridSkeleton'
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
import { loadProductGalleryImages } from '../lib/productImages'
import { loadProductCore } from '../lib/productPageLoad'
import { queryKeys } from '../lib/queryCache'
import { useCachedQuery } from '../lib/useCachedQuery'
import { fetchProductRecommendations } from '../services/api'
import { getProductUrl } from '../lib/productSlug'
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
  const [selectedPackagingId, setSelectedPackagingId] = useState<string | null>(
    null,
  )

  const {
    data: coreData,
    isLoading,
    error: queryError,
  } = useCachedQuery(
    urlRef ? queryKeys.product(urlRef) : null,
    () => loadProductCore(urlRef),
    { enabled: Boolean(urlRef) },
  )

  const product = coreData?.product ?? null
  const categoryPath = coreData?.categoryPath ?? null
  const error = queryError?.message ?? null

  const { data: recommendations, isLoading: recommendationsLoading } =
    useCachedQuery(
      product ? queryKeys.productRecommendations(product.id) : null,
      () => fetchProductRecommendations(product!),
      { enabled: Boolean(product) },
    )

  const relatedProducts = recommendations?.related ?? []
  const alsoLikeProducts = recommendations?.alsoLike ?? []

  const { data: galleryImages } = useCachedQuery(
    product ? queryKeys.productGallery(product.id) : null,
    () => loadProductGalleryImages(product!.id),
    { enabled: Boolean(product) },
  )

  const galleryUrls = useMemo(() => {
    if (!product) return []
    if (galleryImages && galleryImages.length > 0) {
      return galleryImages
        .map((img) => img.image_url)
        .filter((url): url is string => Boolean(url?.trim()))
    }
    return getProductImageUrls(product)
  }, [galleryImages, product])

  useEffect(() => {
    if (!product || urlRef === product.slug) return
    window.history.replaceState(null, '', getProductUrl(product))
  }, [product, urlRef])

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

  if (isLoading && !coreData) {
    return <ProductPageSkeleton />
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

  const recommendationsSection =
    recommendationsLoading && !recommendations ? (
      <div className="product-recommendations">
        <ProductGridSkeleton count={4} />
      </div>
    ) : relatedProducts.length > 0 || alsoLikeProducts.length > 0 ? (
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
            images={galleryUrls}
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

        {recommendationsSection}
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
