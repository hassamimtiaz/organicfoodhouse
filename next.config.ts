import type { NextConfig } from 'next'

const PRIMARY = 'https://www.organicfruithouse.com'

/** .pk domains → primary .com (both common spellings). */
const PK_HOSTS = [
  'www.organicfoodhouse.pk',
  'organicfoodhouse.pk',
  'www.organicfruithouse.pk',
  'organicfruithouse.pk',
] as const

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Avoid Next.js 15 devtools manifest errors during HMR (segment-explorer-node).
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      ...PK_HOSTS.map((host) => ({
        source: '/:path*',
        has: [{ type: 'host' as const, value: host }],
        destination: `${PRIMARY}/:path*`,
        permanent: true,
      })),
      {
        source: '/:path*',
        has: [{ type: 'host' as const, value: 'organicfruithouse.com' }],
        destination: `${PRIMARY}/:path*`,
        permanent: true,
      },
    ]
  },
}

export default nextConfig
