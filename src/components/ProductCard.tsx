import { Link } from 'react-router-dom'
import { whatsappLink } from '../config/site'
import ProductPrice from './ProductPrice'
import type { Product } from '../types'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const emoji = product.name.toLowerCase().includes('mango') ? '🥭' : '🍎'
  const preOrderMsg = `Hi! I want to pre-order ${product.name} from Organic Food House.`

  return (
    <article className="product-card">
      <div className="product-card-visual">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-emoji" aria-hidden="true">
            {emoji}
          </span>
        )}
        <span className="product-badge pre">Pre-order</span>
        {!product.in_stock && (
          <span className="product-badge out">Out of stock</span>
        )}
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        {product.description && (
          <p className="product-desc">{product.description}</p>
        )}
        <div className="product-footer">
          <ProductPrice product={product} />
          <div className="product-actions">
            <a
              href={whatsappLink(preOrderMsg)}
              className="btn btn-primary btn-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pre-order
            </a>
            <Link
              to={`/product/${product.id}`}
              className="btn btn-outline btn-sm"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
