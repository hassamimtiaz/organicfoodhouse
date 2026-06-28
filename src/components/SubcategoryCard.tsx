import Link from 'next/link'
import { IMAGE_SIZES } from '../lib/imageSizes'
import type { Category } from '../types'
import SiteImage from './SiteImage'
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
      href={`/category/${parentSlug}/${subcategory.slug}`}
      className="subcategory-card"
    >
      <div className="subcategory-card-visual">
        {subcategory.image_url ? (
          <SiteImage
            src={subcategory.image_url}
            alt=""
            fill
            sizes={IMAGE_SIZES.categoryCard}
            className="subcategory-card-cover"
          />
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
