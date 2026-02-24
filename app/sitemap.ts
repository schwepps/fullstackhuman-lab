import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { APP_URL, CHAT_PATH } from '@/lib/constants/app'
import { LEGAL_PATHS } from '@/lib/constants/legal'

/** Static last-modified dates — update when content actually changes. */
const LAST_MODIFIED_HOMEPAGE = '2026-02-24'
const LAST_MODIFIED_CHAT = '2026-02-24'
const LAST_MODIFIED_LEGAL = '2026-02-24'

function localeUrl(locale: string, path = ''): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  return `${APP_URL}${prefix}${path}`
}

function localeAlternates(path = '') {
  return {
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, localeUrl(l, path)])
      ),
      'x-default': localeUrl(routing.defaultLocale, path),
    },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homepageEntries: MetadataRoute.Sitemap = routing.locales.map(
    (locale) => ({
      url: localeUrl(locale),
      lastModified: LAST_MODIFIED_HOMEPAGE,
      alternates: localeAlternates(),
    })
  )

  const chatEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: localeUrl(locale, CHAT_PATH),
    lastModified: LAST_MODIFIED_CHAT,
    alternates: localeAlternates(CHAT_PATH),
  }))

  const legalEntries: MetadataRoute.Sitemap = LEGAL_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: LAST_MODIFIED_LEGAL,
      alternates: localeAlternates(path),
    }))
  )

  return [...homepageEntries, ...chatEntries, ...legalEntries]
}
