/**
 * Base URL for the app. Derived from environment:
 * - NEXT_PUBLIC_SITE_URL (set in Vercel/production)
 * - VERCEL_PROJECT_PRODUCTION_URL (auto-set by Vercel)
 * - Falls back to localhost for local dev
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return `http://localhost:${process.env.PORT ?? '3000'}`
}
