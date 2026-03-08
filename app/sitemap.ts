import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { FAILING_PUBLISHED_DATE } from '@/lib/constants/failing'
import { LEGAL_PATHS } from '@/lib/constants/legal'
import { localeUrl, localeAlternates } from '@/lib/seo/urls'

/** Static last-modified dates — update when content actually changes. */
const LAST_MODIFIED_HOMEPAGE = '2026-02-24'
const LAST_MODIFIED_LEGAL = '2026-02-24'
const LAST_MODIFIED_BOOKING = '2026-03-07'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homepageEntries: MetadataRoute.Sitemap = routing.locales.map(
    (locale) => ({
      url: localeUrl(locale),
      lastModified: LAST_MODIFIED_HOMEPAGE,
      alternates: localeAlternates(),
    })
  )

  const legalEntries: MetadataRoute.Sitemap = LEGAL_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: LAST_MODIFIED_LEGAL,
      alternates: localeAlternates(path),
    }))
  )

  const failingEntries: MetadataRoute.Sitemap = routing.locales.map(
    (locale) => ({
      url: localeUrl(locale, '/fAIling'),
      lastModified: FAILING_PUBLISHED_DATE,
      alternates: localeAlternates('/fAIling'),
    })
  )

  const bookingEntries: MetadataRoute.Sitemap = routing.locales.map(
    (locale) => ({
      url: localeUrl(locale, '/book'),
      lastModified: LAST_MODIFIED_BOOKING,
      alternates: localeAlternates('/book'),
    })
  )

  return [
    ...homepageEntries,
    ...legalEntries,
    ...failingEntries,
    ...bookingEntries,
  ]
}
