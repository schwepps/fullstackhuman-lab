import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getResult } from '@/lib/result-store'
import { RESULT_ID_PATTERN, getSiteUrl, BASE_PATH } from '@/lib/constants'
import type { Metadata } from 'next'

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

  const title = `${result.convictName} found GUILTY — Jailnabi`
  const description = `Crime: "${result.crime}" — Sentenced to: ${result.sentence}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`${getSiteUrl()}${BASE_PATH}/api/og?resultId=${id}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${getSiteUrl()}${BASE_PATH}/api/og?resultId=${id}`],
    },
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params

  if (!RESULT_ID_PATTERN.test(id)) notFound()

  const result = await getResult(id)
  if (!result) notFound()

  const shareUrl = `${getSiteUrl()}${BASE_PATH}/result/${id}`

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Jail card */}
      <div className="card border-danger p-6">
        <div className="mb-4 text-center">
          <div className="guilty-stamp inline-block">CONVICTED</div>
        </div>

        <div className="mb-4 text-center">
          <p className="text-2xl font-black">{result.convictName}</p>
        </div>

        <div className="mb-4 rounded-md bg-surface p-3 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Crime
          </p>
          <p className="mt-1 font-semibold">&ldquo;{result.crime}&rdquo;</p>
        </div>

        <div className="mb-4 rounded-md border border-primary bg-primary-muted p-3 text-center">
          <p className="text-xs uppercase tracking-wider text-primary">
            Sentence
          </p>
          <p className="mt-1 text-lg font-bold text-primary">
            {result.sentence}
          </p>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {result.explanation}
        </p>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Jailnabi — Where no one is innocent
          </p>
        </div>
      </div>

      {/* Share + play */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${result.convictName} found GUILTY! "${result.crime}" — Sentence: ${result.sentence} ${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary touch-manipulation"
        >
          Share on WhatsApp
        </a>
        <Link
          href={`${BASE_PATH}/`}
          className="btn btn-secondary touch-manipulation"
        >
          Create Your Own Room
        </Link>
      </div>
    </div>
  )
}
