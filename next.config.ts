import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value:
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://eu-assets.i.posthog.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' https: data:",
        "connect-src 'self' https://*.supabase.co https://eu.i.posthog.com https://eu-assets.i.posthog.com",
        "font-src 'self'",
        "frame-ancestors 'self'",
      ].join('; ') + ';',
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  serverExternalPackages: ['@react-pdf/renderer'],
}

export default withNextIntl(nextConfig)
