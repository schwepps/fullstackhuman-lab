import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { APP_URL, TWITTER_HANDLE } from '@/lib/constants/app'
import { BRAND_NAME_DISPLAY } from '@/lib/constants/brand'
import { FAILING_RULES, type FailingRuleKey } from '@/lib/constants/failing'
import { JsonLd } from '@/components/seo/json-ld'
import { getArticleSchema } from '@/lib/seo/schemas'
import { localeUrl, localePrefix } from '@/lib/seo/urls'
import { Link } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const validLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale
  setRequestLocale(validLocale)
  const t = await getTranslations({
    locale: validLocale,
    namespace: 'failing.metadata',
  })

  const pageUrl = `${APP_URL}${localePrefix(validLocale)}/fAIling`

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      type: 'article',
      locale: validLocale === 'fr' ? 'fr_FR' : 'en_US',
      url: pageUrl,
      siteName: BRAND_NAME_DISPLAY,
      title: t('title'),
      description: t('description'),
      images: [{ url: `${pageUrl}/opengraph-image`, alt: t('ogImageAlt') }],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: t('title'),
      description: t('description'),
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [l, localeUrl(l, '/fAIling')])
        ),
        'x-default': `${APP_URL}/fAIling`,
      },
    },
  }
}

function AiHighlight({ children }: { children: React.ReactNode }) {
  return <span className="text-failing-red">{children}</span>
}

export default async function FailingPage({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return null
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'failing' })

  const richTags = {
    ai: (chunks: React.ReactNode) => <AiHighlight>{chunks}</AiHighlight>,
  }

  const closingTags = {
    ...richTags,
    link: (chunks: React.ReactNode) => (
      <Link
        href="/"
        className="text-failing-amber underline underline-offset-4 transition-colors hover:text-failing-red"
      >
        {chunks}
      </Link>
    ),
  }

  return (
    <>
      <JsonLd data={getArticleSchema(locale)} />
      <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Title */}
        <h1 className="mb-4 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {t.rich('title', richTags)}
          <span className="ml-1 inline-block animate-cursor-blink text-failing-red">
            █
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-6 font-sans text-base italic text-muted-foreground sm:text-lg">
          {t('subtitle')}
        </p>

        {/* Intro */}
        <p className="mb-12 font-sans text-base leading-relaxed text-foreground/80 sm:text-lg">
          {t('intro')}
        </p>

        {/* Rules */}
        {FAILING_RULES.map(({ numeral, key }) => (
          <section key={key}>
            <div className="my-10 h-px bg-failing-red/20 sm:my-12" />
            <h2 className="mb-4 font-mono text-base font-bold uppercase tracking-wide text-foreground sm:text-lg">
              <span className="mr-2 text-xl text-failing-red sm:text-2xl">
                {numeral}.
              </span>
              {t(`rules.${key as FailingRuleKey}.title`)}
            </h2>
            <p className="font-sans text-base leading-relaxed text-foreground/70">
              {t(`rules.${key as FailingRuleKey}.body`)}
            </p>
          </section>
        ))}

        {/* Closing */}
        <div className="my-10 h-px bg-failing-red/20 sm:my-12" />
        <section className="mb-12">
          <h2 className="mb-4 font-mono text-xl font-bold text-foreground sm:text-2xl">
            {t('closing.headline')}
          </h2>
          <div className="space-y-4 font-sans text-base leading-relaxed text-foreground/80 sm:text-lg">
            <p>{t.rich('closing.body', richTags)}</p>
            <p>{t.rich('closing.cta', closingTags)}</p>
          </div>
        </section>
      </article>
    </>
  )
}
