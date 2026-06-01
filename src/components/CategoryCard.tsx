import { Link } from 'react-router-dom'
import type { Category } from '../types'
import './CategoryCard.css'

interface CategoryCardProps {
  category: Category
  subcategoryCount?: number
}

const categoryIcons: Record<string, string> = {
  fruits: '🍎',
}

export default function CategoryCard({
  category,
  subcategoryCount = 0,
}: CategoryCardProps) {
  const icon = categoryIcons[category.slug] ?? '🥗'

  return (
    <Link to={`/category/${category.slug}`} className="category-card">
      <span className="category-icon" aria-hidden="true">
        {icon}
      </span>
      <h3>{category.name}</h3>
      {category.description && <p>{category.description}</p>}
      <span className="category-meta">
        {subcategoryCount} subcategor{subcategoryCount !== 1 ? 'ies' : 'y'}
      </span>
    </Link>
  )
}
