import type { NextConfig } from 'next'

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
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' https: data:",
        // Partykit wildcard: each project gets a unique subdomain (e.g., project.username.partykit.dev)
        `connect-src 'self' wss://*.partykit.dev ws://${process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'}`,
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

  serverExternalPackages: ['@anthropic-ai/sdk'],
}

export default nextConfig
