import { routing } from '@/i18n/routing'
import { APP_URL } from '@/lib/constants/app'

/** Build a full absolute URL with locale prefix. */
export function localeUrl(locale: string, path = ''): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  return `${APP_URL}${prefix}${path}`
}

/** Build locale prefix (empty string for default locale). */
export function localePrefix(locale: string): string {
  return locale === routing.defaultLocale ? '' : `/${locale}`
}

/** Build hreflang alternates object for metadata / sitemap. */
export function localeAlternates(path = '') {
  return {
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, localeUrl(l, path)])
      ),
      'x-default': localeUrl(routing.defaultLocale, path),
    },
  }
}
