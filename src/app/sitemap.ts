import { publicEnv } from '../lib/env'

const STATIC_PATHS = [
  '/',
  '/about-us',
  '/our-values',
  '/gifting',
  '/catalog',
  '/category/fruits',
  '/category/fruits/mangoes',
]

const SEED_PRODUCT_SLUGS = [
  'dasheri-mango',
  'sindhri-mango',
  'premium-chaunsa-mango',
  'anwar-ratol-mango',
]

async function fetchDynamicPaths(): Promise<string[] | null> {
  const url = publicEnv('SUPABASE_URL')
  const key = publicEnv('SUPABASE_ANON_KEY')
  if (!url || !key) return null

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  }

  const [categoriesRes, productsRes] = await Promise.all([
    fetch(`${url}/rest/v1/categories?select=id,slug,parent_id,is_visible`, {
      headers,
      next: { revalidate: 3600 },
    }),
    fetch(`${url}/rest/v1/products?select=slug`, {
      headers,
      next: { revalidate: 3600 },
    }),
  ])

  if (!categoriesRes.ok || !productsRes.ok) return null

  const categories = (await categoriesRes.json()) as Array<{
    id: string
    slug: string
    parent_id: string | null
    is_visible?: boolean
  }>
  const products = (await productsRes.json()) as Array<{ slug?: string }>

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const paths = new Set(STATIC_PATHS)

  for (const category of categories) {
    if (category.is_visible === false) continue

    if (!category.parent_id) {
      paths.add(`/category/${category.slug}`)
      continue
    }

    const parent = categoryById.get(category.parent_id)
    if (!parent || parent.is_visible === false) continue
    paths.add(`/category/${parent.slug}/${category.slug}`)
  }

  for (const product of products) {
    if (product.slug) paths.add(`/product/${product.slug}`)
  }

  return [...paths]
}

export default async function sitemap() {
  const siteUrl = (
    publicEnv('SITE_URL') ?? 'https://www.organicfruithouse.com'
  ).replace(/\/$/, '')

  const dynamicPaths = await fetchDynamicPaths()
  const paths =
    dynamicPaths ??
    [
      ...STATIC_PATHS,
      ...SEED_PRODUCT_SLUGS.map((slug) => `/product/${slug}`),
    ]

  return paths.sort((a, b) => a.localeCompare(b)).map((path) => ({
    url: path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`,
    changeFrequency: 'weekly' as const,
    priority:
      path === '/'
        ? 1
        : path.startsWith('/product/')
          ? 0.8
          : path.includes('/mangoes')
            ? 0.9
            : 0.7,
  }))
}
