import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const siteUrl = (process.env.VITE_SITE_URL || 'https://www.organicfruithouse.com').replace(
  /\/$/,
  '',
)

const STATIC_PATHS = [
  '/',
  '/about-us',
  '/our-values',
  '/category/fruits',
  '/category/fruits/mangoes',
]

const SEED_PRODUCT_SLUGS = [
  'dasheri-mango',
  'sindhri-mango',
  'premium-chaunsa-mango',
  'anwar-ratol-mango',
]

async function fetchSupabasePaths() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  }

  const [categoriesRes, productsRes] = await Promise.all([
    fetch(`${url}/rest/v1/categories?select=id,slug,parent_id,is_visible`, { headers }),
    fetch(`${url}/rest/v1/products?select=slug`, { headers }),
  ])

  if (!categoriesRes.ok || !productsRes.ok) {
    console.warn('Sitemap: Supabase fetch failed, using seed fallback.')
    return null
  }

  const categories = await categoriesRes.json()
  const products = await productsRes.json()

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

function buildSitemap(paths) {
  const urls = paths
    .sort((a, b) => a.localeCompare(b))
    .map((path) => {
      const loc = path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`
      const priority =
        path === '/'
          ? '1.0'
          : path.startsWith('/product/')
            ? '0.8'
            : path.includes('/mangoes')
              ? '0.9'
              : '0.7'
      const changefreq = path.startsWith('/product/') ? 'weekly' : 'weekly'

      return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

function buildRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /cart
Disallow: /order

Sitemap: ${siteUrl}/sitemap.xml
`
}

async function main() {
  const dynamicPaths = await fetchSupabasePaths()
  const paths =
    dynamicPaths ??
    [
      ...STATIC_PATHS,
      ...SEED_PRODUCT_SLUGS.map((slug) => `/product/${slug}`),
    ]

  writeFileSync(join(publicDir, 'sitemap.xml'), buildSitemap(paths), 'utf8')
  writeFileSync(join(publicDir, 'robots.txt'), buildRobotsTxt(), 'utf8')
  console.log(`Generated sitemap with ${paths.length} URLs for ${siteUrl}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
