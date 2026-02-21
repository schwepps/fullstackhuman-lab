export const CONSENT_COOKIE_NAME = 'fsh_consent'
export const CONSENT_COOKIE_MAX_AGE_SECONDS = 182 * 24 * 60 * 60 // ~6 months (CNIL recommendation)

export type ConsentState = 'granted' | 'denied'

export const LEGAL_PATHS = ['/privacy', '/terms', '/legal'] as const
