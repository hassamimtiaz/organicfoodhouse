import Link from 'next/link'
import { SITE, whatsappLink } from '../config/site'
import {
  getAdvanceOrderLabel,
  isComingSoonProduct,
  isPreorderOrder,
  isProductOrderable,
} from '../config/preorder'
import { getProductPrimaryImage } from '../config/productImages'
import { getProductUrl } from '../lib/productSlug'
import AddToCartButton from './AddToCartButton'
import ProductPrice from './ProductPrice'
import PreorderStatus from './PreorderStatus'
import type { Product } from '../types'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const emoji = product.name.toLowerCase().includes('mango') ? '🥭' : '🍎'
  const comingSoon = isComingSoonProduct(product)
  const orderable = isProductOrderable(product)
  const advanceOrder = isPreorderOrder(product) && !product.in_stock
  const whatsappMsg = advanceOrder || comingSoon
    ? `Hi! I want to pre-order ${product.name} from ${SITE.name}.`
    : `Hi! I want to order ${product.name} from ${SITE.name}.`
  const productUrl = getProductUrl(product)
  const coverImage = getProductPrimaryImage(product)

  return (
    <article className={`product-card ${comingSoon ? 'product-card--coming-soon' : ''}`}>
      <Link
        href={productUrl}
        className="product-card-link"
        aria-label={`View ${product.name} details`}
      />
      <div className="product-card-visual">
        {coverImage ? (
          <img src={coverImage} alt={product.name} loading="lazy" />
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
        {product.description && (
          <p className="product-desc">{product.description}</p>
        )}
        <PreorderStatus product={product} variant="card" />
        <div className="product-footer">
          <ProductPrice product={product} />
          <div className="product-actions">
            <AddToCartButton product={product} size="sm" variant="primary" />
            <a
              href={whatsappLink(whatsappMsg)}
              className="btn btn-outline btn-sm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {comingSoon ? 'Pre-order' : 'Order'}
            </a>
            <Link
              href={productUrl}
              className="btn btn-outline btn-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {comingSoon ? 'Pre-order details' : 'View details'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
