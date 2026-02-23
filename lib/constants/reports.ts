import { APP_URL } from '@/lib/constants/app'
import { routing } from '@/i18n/routing'

/** Share token format: 32 hex chars (UUID without hyphens) */
export const SHARE_TOKEN_REGEX = /^[0-9a-f]{32}$/i

/** Maximum characters for OG description extracted from report content */
export const OG_DESCRIPTION_MAX_LENGTH = 160

/** Build a locale-aware public share URL for a report */
export function buildReportShareUrl(token: string, locale?: string): string {
  const isDefault = !locale || locale === routing.defaultLocale
  return isDefault
    ? `${APP_URL}/report/${token}`
    : `${APP_URL}/${locale}/report/${token}`
}
