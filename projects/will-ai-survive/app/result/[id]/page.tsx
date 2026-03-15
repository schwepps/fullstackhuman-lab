import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getResult } from '@/lib/result-store'
import { RESULT_ID_PATTERN } from '@/lib/validation'
import { getSiteUrl, APP_NAME } from '@/lib/constants'
import { ChaosMeter } from '@/components/chaos-meter'
import { Timeline } from '@/components/timeline'
import { BreakingPoint } from '@/components/breaking-point'
import { ResignationLetter } from '@/components/resignation-letter'
import { RealTalk } from '@/components/real-talk'
import { ShareButtons } from '@/components/share-buttons'

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

  return {
    title: `AI Survived ${result.survivalDuration} | ${APP_NAME}`,
    description: result.oneLineSummary,
    openGraph: {
      title: `AI Survived ${result.survivalDuration} at My Job`,
      description: result.oneLineSummary,
      images: [`${getSiteUrl()}/api/og?id=${id}`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `AI Survived ${result.survivalDuration} at My Job`,
      description: result.oneLineSummary,
      images: [`${getSiteUrl()}/api/og?id=${id}`],
    },
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params
  if (!RESULT_ID_PATTERN.test(id)) notFound()

  const result = await getResult(id)
  if (!result) notFound()

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col px-4 py-8 sm:py-16">
      {/* Header */}
      <header className="mb-8 text-center sm:mb-12">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-corporate sm:text-3xl">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-sm text-muted">
          AI tried this job. Here&apos;s what happened.
        </p>
      </header>

      {/* Case file */}
      {result.situation && (
        <div className="card-dim mb-6 border-l-4 border-l-corporate p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Case File
          </p>
          <p className="mt-1 text-sm leading-relaxed">{result.situation}</p>
        </div>
      )}

      {/* Result — no animations on SSR page */}
      <div className="flex flex-col gap-6">
        <ChaosMeter
          rating={result.chaosRating}
          label={result.chaosLabel}
          survivalDuration={result.survivalDuration}
        />

        {result.timeline.length > 0 && <Timeline entries={result.timeline} />}

        {result.breakingPoint && (
          <BreakingPoint content={result.breakingPoint} />
        )}

        {result.resignationLetter && (
          <ResignationLetter content={result.resignationLetter} />
        )}

        {result.realTalkInsight && (
          <RealTalk insight={result.realTalkInsight} />
        )}

        <ShareButtons
          resultId={result.id}
          chaosRating={result.chaosRating}
          chaosLabel={result.chaosLabel}
          survivalDuration={result.survivalDuration}
          breakingPoint={result.breakingPoint}
        />

        {/* CTA */}
        <Link href="/" className="btn-corporate w-full text-center">
          Try Your Own Job
        </Link>
      </div>
    </main>
  )
}
