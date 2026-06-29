import type { Metadata } from 'next'
import JsonLdServer from '../../../../components/JsonLdServer'
import ProductPage from '../../../../views/ProductPage'
import { getProductPrimaryImage } from '../../../../config/productImages'
import { getProductSeoExtension } from '../../../../config/productSeo'
import { SITE } from '../../../../config/site'
import {
  buildBreadcrumbListSchema,
  buildProductBreadcrumbItems,
  buildProductSchema,
} from '../../../../lib/seo'
import { getProductUrl } from '../../../../lib/productSlug'
import { buildPageMetadata } from '../../../../lib/metadata'
import { fetchAllProductSlugs } from '../../../../services/api'
import {
  fetchProductBySlugOrId,
  getProductCategoryPath,
} from '../../../../services/ordersApi'

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
  const product = await fetchProductBySlugOrId(slug)

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
  const product = await fetchProductBySlugOrId(slug)

  if (!product) {
    return <ProductPage slug={slug} />
  }

  const categoryPath = await getProductCategoryPath(product)
  const breadcrumbItems = buildProductBreadcrumbItems(product, categoryPath)

  return (
    <>
      <head>
        <JsonLdServer id="json-ld-product" data={buildProductSchema(product)} />
        <JsonLdServer
          id="json-ld-breadcrumbs"
          data={buildBreadcrumbListSchema(breadcrumbItems)}
        />
      </head>
      <ProductPage slug={slug} />
    </>
  )
}
