import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getResult } from '@/lib/result-store'
import { getSiteUrl, BASE_PATH, RESULT_ID_PATTERN } from '@/lib/constants'
import { getScoreCssClass } from '@/lib/scoring'
import { ShareButtons } from '@/components/share-buttons'
import { SupportCta } from '@/components/support-cta'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  if (!RESULT_ID_PATTERN.test(id)) return {}

  const result = await getResult(id)
  if (!result) return {}

  const title = `${result.label}! ${result.wordCount} words for ${result.challengeName} — Prompt Golf`
  const description = `I described ${result.challengeName} with just "${result.prompt}" (${result.wordCount} words). Can you do better?`
  const ogUrl = `${getSiteUrl()}${BASE_PATH}/api/og?id=${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl],
    },
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params

  if (!RESULT_ID_PATTERN.test(id)) notFound()

  const result = await getResult(id)
  if (!result) notFound()

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 pb-safe sm:px-6 sm:py-12">
      <div className="text-center">
        <span className="font-mono text-xs text-muted-foreground">
          {result.holeName}
        </span>
        <h1 className="mt-1 font-serif text-2xl font-bold text-foreground">
          {result.challengeName}
        </h1>
      </div>

      <div className="gold-divider mx-auto mt-4 w-24" />

      {/* Score card */}
      <div className="mt-6 club-card p-6 text-center">
        {/* The prompt (hero) */}
        <p className="font-serif text-xl text-foreground">
          &ldquo;{result.prompt}&rdquo;
        </p>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div>
            <span className="font-mono text-3xl font-bold text-primary">
              {result.wordCount}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              {result.wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span
              className={`font-serif text-3xl font-bold ${getScoreCssClass(result.label)}`}
            >
              {result.label}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              par {result.par}
            </span>
          </div>
        </div>

        {result.attemptNumber > 1 && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Attempt #{result.attemptNumber} &middot; {result.effectiveStrokes}{' '}
            effective strokes
          </p>
        )}
      </div>

      {/* Share buttons */}
      <div className="mt-6">
        <ShareButtons
          challengeName={result.challengeName}
          holeName={result.holeName}
          prompt={result.prompt}
          wordCount={result.wordCount}
          label={result.label}
          resultId={result.id}
        />
      </div>

      {/* Try this hole */}
      <Link
        href={`/play/${result.challengeId}`}
        className="btn-fairway mt-4 block text-center"
      >
        Try This Hole
      </Link>

      {/* Support */}
      <div className="mt-6">
        <SupportCta variant="inline" />
      </div>
    </div>
  )
}
