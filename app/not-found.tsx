// next/link used intentionally — this page renders outside [locale] layout
// where next-intl's Link is unavailable
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import './globals.css'

const TEXTS = {
  fr: {
    title: '404 \u2014 Introuvable',
    description:
      'Cette page n\u2019existe pas ou a \u00e9t\u00e9 d\u00e9plac\u00e9e.',
    backHome: 'Retour \u00e0 l\u2019accueil',
  },
  en: {
    title: 'Page not found',
    description: 'The page you are looking for does not exist.',
    backHome: 'Back to Home',
  },
} as const

type Locale = keyof typeof TEXTS

/**
 * Lightweight locale detection for the root 404 page (outside [locale] layout).
 * Cannot use next-intl here. Keep in sync with i18n/routing.ts.
 */
async function detectLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  if (cookieLocale === 'en') return 'en'

  const headersList = await headers()
  const acceptLang = headersList.get('accept-language') ?? ''
  if (/(?:^|,\s*)en(?:[;,_-]|$)/i.test(acceptLang)) return 'en'

  return 'fr'
}

export default async function RootNotFound() {
  const locale = await detectLocale()
  const t = TEXTS[locale]
  const homeHref = locale === 'fr' ? '/' : '/en'

  return (
    <html lang={locale}>
      <body className="bg-background font-mono text-foreground antialiased">
        <div className="flex min-h-svh flex-col items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/10" />
              <div className="absolute inset-2 rounded-full bg-primary/5" />
              <span className="relative text-5xl font-bold text-primary">
                404
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t.title}
            </h1>
            <p className="mt-4 text-muted-foreground">{t.description}</p>
            <div className="mt-8">
              <Link
                href={homeHref}
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t.backHome}
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
