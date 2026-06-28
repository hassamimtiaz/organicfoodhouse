import type { Metadata } from 'next'
import CategoryPage from '../../../../views/CategoryPage'
import { fetchCategoryBySlug } from '../../../../services/api'
import { buildPageMetadata } from '../../../../lib/metadata'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await fetchCategoryBySlug(slug)

  if (!category) {
    return buildPageMetadata({ title: 'Category not found', path: `/category/${slug}` })
  }

  return buildPageMetadata({
    title: category.name,
    path: `/category/${slug}`,
    description: `Shop ${category.name.toLowerCase()} — seasonal organic produce from ${category.name} at Organic Fruit House.`,
    image: category.image_url ?? undefined,
  })
}

export default async function CategoryRoutePage({ params }: Props) {
  const { slug } = await params
  return <CategoryPage slug={slug} />
}
