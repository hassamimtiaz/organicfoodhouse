import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProductJsonLd from '../../../../components/ProductJsonLd'
import ProductPage from '../../../../views/ProductPage'
import { getProductPrimaryImage } from '../../../../config/productImages'
import { getProductSeoExtension } from '../../../../config/productSeo'
import { SITE } from '../../../../config/site'
import { buildPageMetadata } from '../../../../lib/metadata'
import { getProductUrl } from '../../../../lib/productSlug'
import { fetchAllProductSlugs } from '../../../../services/api'
import { fetchProductBySlugOrId } from '../../../../services/ordersApi'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await fetchAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProductBySlugOrId(slug, { includeGallery: false })

  if (!product) {
    return buildPageMetadata({ title: 'Product not found', path: `/product/${slug}` })
  }

  const seoExt = getProductSeoExtension(slug)

  return buildPageMetadata({
    title: seoExt?.metaTitle ?? product.name,
    description: seoExt?.metaDescription ?? product.description ?? SITE.description,
    path: getProductUrl(product),
    image: getProductPrimaryImage(product) ?? undefined,
  })
}

export default async function ProductRoutePage({ params }: Props) {
  const { slug } = await params

  return (
    <>
      <Suspense fallback={null}>
        <ProductJsonLd slug={slug} />
      </Suspense>
      <ProductPage slug={slug} />
    </>
  )
}
