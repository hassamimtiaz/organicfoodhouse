import JsonLdServer from './JsonLdServer'
import {
  buildBreadcrumbListSchema,
  buildProductBreadcrumbItems,
  buildProductSchema,
} from '../lib/seo'
import {
  fetchProductBySlugOrId,
  getProductCategoryPath,
} from '../services/ordersApi'

export default async function ProductJsonLd({ slug }: { slug: string }) {
  const product = await fetchProductBySlugOrId(slug, { includeGallery: false })
  if (!product) return null

  const categoryPath = await getProductCategoryPath(product)
  const breadcrumbItems = buildProductBreadcrumbItems(product, categoryPath)

  return (
    <>
      <JsonLdServer id="json-ld-product" data={buildProductSchema(product)} />
      <JsonLdServer
        id="json-ld-breadcrumbs"
        data={buildBreadcrumbListSchema(breadcrumbItems)}
      />
    </>
  )
}
