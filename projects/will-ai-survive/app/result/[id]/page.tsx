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
import { SupportCta } from '@/components/support-cta'
import { ArrowRightIcon } from '@/components/icons'

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
      images: [`${getSiteUrl()}/api/og?id=${id}`],
      type: 'website',
      siteName: 'FullStackHuman',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
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
    <main className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-3xl flex-col px-4 py-8 sm:py-12">
      {/* Header */}
      <header className="mb-8 text-center sm:mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-sm text-muted">
          AI tried your job. Here&apos;s what happened.
        </p>
      </header>

      {/* Case file — outstanding with accent border */}
      {result.situation && (
        <div className="mb-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="h-0.75 w-full bg-foreground" />
          <div className="px-5 py-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">
              Case File
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">
              {result.situation}
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      <div className="flex flex-col gap-6">
        <ChaosMeter
          rating={result.chaosRating}
          label={result.chaosLabel}
          survivalDuration={result.survivalDuration}
          animate={false}
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

        <SupportCta />

        {/* CTA */}
        <Link
          href="/"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98]"
        >
          Try Your Own Job
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </main>
  )
}
