import { Link } from 'react-router-dom'
import { whatsappLink } from '../config/site'
import { isComingSoonProduct } from '../config/preorder'
import { getProductUrl } from '../lib/productSlug'
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
  const whatsappMsg = comingSoon
    ? `Hi! I want to pre-order ${product.name} from Organic Food House.`
    : `Hi! I want to order ${product.name} from Organic Food House.`
  const productUrl = getProductUrl(product)

  return (
    <article className={`product-card ${comingSoon ? 'product-card--coming-soon' : ''}`}>
      <Link
        to={productUrl}
        className="product-card-link"
        aria-label={`View ${product.name} details`}
      />
      <div className="product-card-visual">
        {product.image_url ? (
          <img src={product.image_url} alt="" loading="lazy" />
        ) : (
          <span className="product-emoji" aria-hidden="true">
            {emoji}
          </span>
        )}
        {comingSoon && (
          <>
            <span className="product-badge product-badge--soon">Coming soon</span>
            {product.in_stock && (
              <span className="product-badge product-badge--preorder">
                Pre-order
              </span>
            )}
          </>
        )}
        {!product.in_stock && (
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
            <a
              href={whatsappLink(whatsappMsg)}
              className="btn btn-primary btn-sm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {comingSoon ? 'Pre-order' : 'Order'}
            </a>
            <Link
              to={productUrl}
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
