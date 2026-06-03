import { Link } from 'react-router-dom'
import type { Category } from '../types'
import './SubcategoryCard.css'

interface SubcategoryCardProps {
  parentSlug: string
  subcategory: Category
  productCount?: number
}

const subcategoryIcons: Record<string, string> = {
  mangoes: '🥭',
}

export default function SubcategoryCard({
  parentSlug,
  subcategory,
  productCount = 0,
}: SubcategoryCardProps) {
  const icon = subcategoryIcons[subcategory.slug] ?? '🍽️'

  return (
    <Link
      to={`/category/${parentSlug}/${subcategory.slug}`}
      className="subcategory-card"
    >
      <div className="subcategory-card-visual">
        {subcategory.image_url ? (
          <img src={subcategory.image_url} alt="" loading="lazy" />
        ) : (
          <span className="subcategory-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <h3>{subcategory.name}</h3>
      {subcategory.description && <p>{subcategory.description}</p>}
      <span className="subcategory-meta">
        {productCount} variety{productCount !== 1 ? 'ies' : ''}
      </span>
    </Link>
  )
}
