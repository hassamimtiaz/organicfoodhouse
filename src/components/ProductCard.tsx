import Link from 'next/link'
import { SITE, whatsappLink } from '../config/site'
import {
  getAdvanceOrderLabel,
  isComingSoonProduct,
  isPreorderOrder,
  isProductOrderable,
} from '../config/preorder'
import { getDefaultPackaging, hasPackagings } from '../config/packaging'
import { getProductPrimaryImage } from '../config/productImages'
import { IMAGE_SIZES } from '../lib/imageSizes'
import { prefetchProductPage } from '../lib/productPageLoad'
import { getProductUrl } from '../lib/productSlug'
import AddToCartButton from './AddToCartButton'
import ProductPrice from './ProductPrice'
import PreorderStatus from './PreorderStatus'
import SiteImage from './SiteImage'
import type { Product } from '../types'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
  compact?: boolean
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const emoji = product.name.toLowerCase().includes('mango') ? '🥭' : '🍎'
  const comingSoon = isComingSoonProduct(product)
  const orderable = isProductOrderable(product)
  const advanceOrder = isPreorderOrder(product) && !product.in_stock
  const whatsappMsg = advanceOrder || comingSoon
    ? `Hi! I want to pre-order ${product.name} from ${SITE.name}.`
    : `Hi! I want to order ${product.name} from ${SITE.name}.`
  const productUrl = getProductUrl(product)
  const coverImage = getProductPrimaryImage(product)
  const defaultPackagingId = hasPackagings(product)
    ? getDefaultPackaging(product)?.id ?? null
    : null
  const productSlug = product.slug ?? product.id

  return (
    <article
      className={`product-card${comingSoon ? ' product-card--coming-soon' : ''}${compact ? ' product-card--compact' : ''}`}
      onMouseEnter={() => prefetchProductPage(productSlug)}
      onFocusCapture={() => prefetchProductPage(productSlug)}
      onTouchStart={() => prefetchProductPage(productSlug)}
    >
      <Link
        href={productUrl}
        className="product-card-link"
        aria-label={`View ${product.name} details`}
        prefetch
      />
      <div className="product-card-visual">
        {coverImage ? (
          <SiteImage
            src={coverImage}
            alt={product.name}
            fill
            sizes={IMAGE_SIZES.productCard}
            className="product-card-cover"
          />
        ) : (
          <span className="product-emoji" aria-hidden="true">
            {emoji}
          </span>
        )}
        {comingSoon && (
          <>
            <span className="product-badge product-badge--soon">Coming soon</span>
            {orderable && (
              <span className="product-badge product-badge--preorder">
                Pre-order
              </span>
            )}
          </>
        )}
        {!product.in_stock && !comingSoon && orderable && (
          <span className="product-badge product-badge--preorder">
            {getAdvanceOrderLabel(product)}
          </span>
        )}
        {!orderable && (
          <span className="product-badge out">Out of stock</span>
        )}
      </div>

      <div className="product-card-body">
        <h3>
          <span className="product-card-title">{product.name}</span>
        </h3>
        {product.description && !compact && (
          <p className="product-desc">{product.description}</p>
        )}
        {!compact && <PreorderStatus product={product} variant="card" />}
        <div className="product-footer">
          <ProductPrice product={product} />
          <div className="product-actions">
            <AddToCartButton
              product={product}
              packagingId={defaultPackagingId}
              size="sm"
              variant="primary"
            />
            <a
              href={whatsappLink(whatsappMsg)}
              className="btn btn-outline btn-sm product-action-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {comingSoon ? 'Pre-order' : 'WhatsApp'}
            </a>
            {!compact && (
              <Link
                href={productUrl}
                className="btn btn-outline btn-sm product-action-details"
                onClick={(e) => e.stopPropagation()}
              >
                {comingSoon ? 'Pre-order details' : 'View details'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
