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

function slugFromName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const env = { ...loadEnv(), ...process.env }
const base = (env.VITE_SITE_URL || 'https://organicfoods.pk').replace(/\/$/, '')

const staticPaths = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/category/fruits', priority: '0.9', changefreq: 'weekly' },
  { loc: '/category/fruits/mangoes', priority: '1.0', changefreq: 'daily' },
  { loc: '/about-us', priority: '0.7', changefreq: 'monthly' },
  { loc: '/our-values', priority: '0.7', changefreq: 'monthly' },
  { loc: '/search', priority: '0.7', changefreq: 'weekly' },
]

const seedProductSlugs = [
  'dasheri-mango',
  'sindhri-mango',
  'premium-chaunsa-mango',
  'anwar-ratol-mango',
]

async function fetchProductSlugs() {
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return seedProductSlugs

  try {
    const res = await fetch(
      `${url}/rest/v1/products?select=slug,name&order=name.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    )
    if (!res.ok) return seedProductSlugs
    const rows = await res.json()
    return rows
      .map((r) => r.slug || slugFromName(r.name || ''))
      .filter(Boolean)
  } catch {
    return seedProductSlugs
  }
}

const productSlugs = await fetchProductSlugs()
const urls = [
  ...staticPaths,
  ...productSlugs.map((slug) => ({
    loc: `/product/${slug}`,
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
