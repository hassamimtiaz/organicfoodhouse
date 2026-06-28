import Link from 'next/link'
import ProductCard from './ProductCard'
import type { Product } from '../types'
import './ProductGridSection.css'

interface ProductGridSectionProps {
  title: string
  description?: string
  products: Product[]
  viewAll?: { label: string; to: string }
}

export default function ProductGridSection({
  title,
  description,
  products,
  viewAll,
}: ProductGridSectionProps) {
  if (products.length === 0) return null

  return (
    <section className="product-grid-section">
      <div className="product-grid-section-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {viewAll && (
          <Link href={viewAll.to} className="product-grid-section-link">
            {viewAll.label} →
          </Link>
        )}
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
