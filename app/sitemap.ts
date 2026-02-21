import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { LEGAL_PATHS } from '@/lib/constants/legal'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fullstackhuman.com'

function localeUrl(locale: string, path = ''): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  return `${BASE_URL}${prefix}${path}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const homepageEntries: MetadataRoute.Sitemap = routing.locales.map(
    (locale) => ({
      url: localeUrl(locale),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, localeUrl(l)])
        ),
      },
    })
  )

  const legalEntries: MetadataRoute.Sitemap = LEGAL_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, localeUrl(l, path)])
        ),
      },
    }))
  )

  return [...homepageEntries, ...legalEntries]
}
