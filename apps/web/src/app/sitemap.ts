import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ceylonweddings.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/vendors',
    '/ideas',
    '/how-it-works',
    '/for-vendors',
    '/about',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${BASE}/en${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  return staticRoutes
}
