import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { TWITTER_HANDLE } from '@/lib/constants/app'
import { BRAND_NAME_DISPLAY } from '@/lib/constants/brand'
import {
  OG_DESCRIPTION_MAX_LENGTH,
  SHARE_TOKEN_REGEX,
  buildReportShareUrl,
} from '@/lib/constants/reports'
import { getReportByToken } from '@/lib/reports/queries'
import { ReportView } from '@/components/report/report-view'
import type { PersonaId } from '@/types/chat'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string; token: string }>
}

function getMetaTitle(
  t: Awaited<ReturnType<typeof getTranslations<'report'>>>,
  persona: PersonaId
) {
  switch (persona) {
    case 'doctor':
      return t('metaTitleDoctor')
    case 'critic':
      return t('metaTitleCritic')
    case 'guide':
      return t('metaTitleGuide')
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, token } = await params
  if (!SHARE_TOKEN_REGEX.test(token)) return {}

  const report = await getReportByToken(token)
  if (!report) return {}

  const validLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale

  const t = await getTranslations({ locale: validLocale, namespace: 'report' })
  const pageTitle = getMetaTitle(t, report.persona)

  // Extract plain-text snippet for OG description
  const plainText = report.content
    .replace(/^#.*$/gm, '') // strip headings
    .replace(/[*_`#>~\[\]]/g, '') // strip markdown symbols
    .replace(/\n+/g, ' ')
    .trim()
  const description = plainText.slice(0, OG_DESCRIPTION_MAX_LENGTH)

  const reportUrl = buildReportShareUrl(token, validLocale)

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url: reportUrl,
      type: 'article',
      siteName: BRAND_NAME_DISPLAY,
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: pageTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function PublicReportPage({ params }: Props) {
  const { locale, token } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  if (!SHARE_TOKEN_REGEX.test(token)) {
    notFound()
  }
  setRequestLocale(locale)

  const report = await getReportByToken(token)
  if (!report) notFound()

  return <ReportView report={report} locale={locale} />
}
