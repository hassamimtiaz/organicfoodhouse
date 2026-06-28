import type { Metadata } from 'next'
import CategoryPage from '../../../../../views/CategoryPage'
import { fetchSubcategoryBySlug } from '../../../../../services/api'
import { buildPageMetadata } from '../../../../../lib/metadata'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string; subcategorySlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subcategorySlug } = await params
  const result = await fetchSubcategoryBySlug(slug, subcategorySlug)

  if (!result) {
    return buildPageMetadata({
      title: 'Category not found',
      path: `/category/${slug}/${subcategorySlug}`,
    })
  }

  return buildPageMetadata({
    title: result.subcategory.name,
    path: `/category/${slug}/${subcategorySlug}`,
    description: `Shop ${result.subcategory.name.toLowerCase()} — carbide-free organic fruit from Organic Fruit House.`,
    image: result.subcategory.image_url ?? undefined,
  })
}

export default async function SubcategoryRoutePage({ params }: Props) {
  const { slug, subcategorySlug } = await params
  return <CategoryPage slug={slug} subcategorySlug={subcategorySlug} />
}
