import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { APP_URL } from '@/lib/constants/app'
import { CookieConsentProvider } from '@/components/layout/cookie-consent-provider'
import { WebMcpRegistration } from '@/components/seo/webmcp-registration'
import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const validLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale
  const t = await getTranslations({
    locale: validLocale,
    namespace: 'metadata',
  })

  const localeUrl =
    validLocale === routing.defaultLocale
      ? APP_URL
      : `${APP_URL}/${validLocale}`

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: t('title'),
      template: '%s | Fullstackhuman',
    },
    description: t('description'),
    keywords: [
      'AI consulting',
      'product strategy',
      'tech leadership',
      'project diagnostic',
      'product review',
      'conseil IA',
      'stratégie produit',
    ],
    authors: [{ name: 'François Schuers' }],
    creator: 'Fullstackhuman',
    category: 'technology',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: validLocale === 'fr' ? 'fr_FR' : 'en_US',
      url: localeUrl,
      siteName: 'Fullstackhuman',
      title: t('title'),
      description: t('description'),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: localeUrl,
      languages: Object.fromEntries(
        routing.locales.map((l) => [
          l,
          l === routing.defaultLocale ? APP_URL : `${APP_URL}/${l}`,
        ])
      ),
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <CookieConsentProvider>{children}</CookieConsentProvider>
          <WebMcpRegistration />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
