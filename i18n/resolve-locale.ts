import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

/**
 * Narrows a raw locale string to a valid app locale,
 * falling back to the default locale.
 */
export function resolveLocale(locale: string) {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
}
