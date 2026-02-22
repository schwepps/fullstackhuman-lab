import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { APP_URL } from '@/lib/constants/app'
import { LEGAL_PATHS } from '@/lib/constants/legal'

/**
 * Public marketing pages that AI crawlers should index.
 * Generated from LEGAL_PATHS x locales to stay in sync with sitemap.
 * Chat, auth, and account are app experiences — not for indexing.
 */
const AI_BOT_ALLOW = [
  '/',
  ...routing.locales
    .filter((l) => l !== routing.defaultLocale)
    .map((l) => `/${l}/`),
  ...LEGAL_PATHS.flatMap((path) => [
    path,
    ...routing.locales
      .filter((l) => l !== routing.defaultLocale)
      .map((l) => `/${l}${path}`),
  ]),
]
const AI_BOT_DISALLOW = ['/api/', '/chat', '/auth/', '/account']

/** AI search engine bots that we explicitly allow on public pages. */
const AI_BOT_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'Google-Extended',
  'PerplexityBot',
  'ClaudeBot',
  'anthropic-ai',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      ...AI_BOT_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: AI_BOT_ALLOW,
        disallow: AI_BOT_DISALLOW,
      })),
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
