/**
 * Generates public/sitemap.xml — run before build: npm run sitemap
 * Uses VITE_SITE_URL from .env when present; fetches live product URLs from Supabase if configured.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) return {}
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = { ...loadEnv(), ...process.env }
const base = (env.VITE_SITE_URL || 'https://organicfoods.pk').replace(/\/$/, '')

const staticPaths = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/category/fruits', priority: '0.9', changefreq: 'weekly' },
  { loc: '/category/fruits/mangoes', priority: '1.0', changefreq: 'daily' },
  { loc: '/search', priority: '0.7', changefreq: 'weekly' },
]

const seedProductIds = [
  'seed-dasheri',
  'seed-sindhri',
  'seed-chaunsa',
  'seed-anwar-ratol',
]

async function fetchProductIds() {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return seedProductIds

  try {
    const res = await fetch(
      `${url}/rest/v1/products?select=id&order=name.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    )
    if (!res.ok) return seedProductIds
    const rows = await res.json()
    return rows.map((r) => r.id).filter(Boolean)
  } catch {
    return seedProductIds
  }
}

const productIds = await fetchProductIds()
const urls = [
  ...staticPaths,
  ...productIds.map((id) => ({
    loc: `/product/${id}`,
    priority: '0.85',
    changefreq: 'weekly',
  })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

const out = resolve(root, 'public/sitemap.xml')
writeFileSync(out, xml)
console.log(`Wrote ${urls.length} URLs to public/sitemap.xml (${base})`)
