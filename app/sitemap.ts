import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fullstackhuman.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  return routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? BASE_URL : `${BASE_URL}/${locale}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 1,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          l === routing.defaultLocale ? BASE_URL : `${BASE_URL}/${l}`,
        ])
      ),
    },
  }))
}
