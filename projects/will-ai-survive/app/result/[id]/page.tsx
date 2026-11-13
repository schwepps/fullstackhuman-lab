import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getResult } from '@/lib/result-store'
import { RESULT_ID_PATTERN } from '@/lib/validation'
import { getAppUrl, APP_NAME } from '@/lib/constants'
import { SurvivalReport } from '@/components/survival-report'
import { ShareButtons } from '@/components/share-buttons'
import { SupportCta } from '@/components/support-cta'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  if (!RESULT_ID_PATTERN.test(id)) {
    return { title: `Result Not Found | ${APP_NAME}` }
  }

  const result = await getResult(id)

  if (!result) {
    return { title: `Result Not Found | ${APP_NAME}` }
  }

  const ogTitle = `AI would last ${result.survivalDuration} at my job`
  const ogDescription = `Chaos: ${result.chaosRating}/10 — "${result.chaosLabel}" | ${APP_NAME}`

  return {
    title: `${ogTitle} | ${APP_NAME}`,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [`${getAppUrl()}/api/og?id=${id}`],
      type: 'website',
      siteName: 'FullStackHuman',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [`${getAppUrl()}/api/og?id=${id}`],
    },
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params
  if (!RESULT_ID_PATTERN.test(id)) notFound()

  const result = await getResult(id)
  if (!result) notFound()

  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-16 lg:pt-14">
      <SurvivalReport
        isStreaming={false}
        animate={false}
        report={{
          ...result,
          breakingPoint: result.breakingPoint || null,
          resignationLetter: result.resignationLetter || null,
          oneLineSummary: result.oneLineSummary || null,
          realTalkInsight: result.realTalkInsight || null,
        }}
      />
      <ShareButtons
        resultId={result.id}
        chaosRating={result.chaosRating}
        chaosLabel={result.chaosLabel}
        survivalDuration={result.survivalDuration}
        breakingPoint={result.breakingPoint}
      />
      <Link
        href="/"
        className="notch-8 pixel mt-6 flex min-h-14 w-full items-center justify-center bg-magenta text-sm text-paper"
      >
        Send the AI to your job
      </Link>
      <div className="py-10">
        <SupportCta />
      </div>
    </main>
  )
}
