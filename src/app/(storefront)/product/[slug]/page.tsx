import type { Metadata } from 'next'
import ProductPage from '../../../../views/ProductPage'
import { getProductPrimaryImage } from '../../../../config/productImages'
import { SITE } from '../../../../config/site'
import { getProductUrl } from '../../../../lib/productSlug'
import { buildPageMetadata } from '../../../../lib/metadata'
import { fetchProductBySlugOrId } from '../../../../services/ordersApi'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProductBySlugOrId(slug)

  if (!product) {
    return buildPageMetadata({ title: 'Product not found', path: `/product/${slug}` })
  }

  return buildPageMetadata({
    title: product.name,
    description: product.description ?? SITE.description,
    path: getProductUrl(product),
    image: getProductPrimaryImage(product) ?? undefined,
  })
}

export default async function ProductRoutePage({ params }: Props) {
  const { slug } = await params
  return <ProductPage slug={slug} />
}
