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
  const description = `Crime: "${result.crimeText}" — Convicted by ${result.winningAccuserName}`

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

  if (!RESULT_ID_PATTERN.test(id)) {
    notFound()
  }

  const result = await getResult(id)
  if (!result) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary touch-manipulation"
      >
        &larr; Back to The Yard
      </Link>

      {/* Conviction card */}
      <div className="card border-danger p-6">
        <div className="mb-4 text-center">
          <div className="guilty-stamp inline-block">CONVICTED</div>
        </div>

        <div className="mb-4 text-center">
          <p className="text-2xl font-black">{result.convictName}</p>
          <p className="inmate-number mt-1">
            Conviction #{result.convictionCount || 1}
          </p>
        </div>

        <div className="mb-4 rounded-md bg-surface p-3 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Crime
          </p>
          <p className="mt-1 font-semibold">&ldquo;{result.crimeText}&rdquo;</p>
        </div>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Key Evidence by {result.winningAccuserName}
          </p>
          <div className="evidence-card mt-2 border-l-danger bg-surface">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {result.winningEvidence}
            </pre>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{result.explanation}</p>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Jailnabi — Where no one is innocent
          </p>
        </div>
      </div>

      {/* Share buttons */}
      <div className="mt-4 flex justify-center gap-3">
        <ShareButton
          label="Share on WhatsApp"
          href={`https://wa.me/?text=${encodeURIComponent(`${result.convictName} found GUILTY of "${result.crimeText}" 🔒 ${getSiteUrl()}${BASE_PATH}/result/${id}`)}`}
        />
        <ShareButton
          label="Share on LinkedIn"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${getSiteUrl()}${BASE_PATH}/result/${id}`)}`}
        />
      </div>
    </div>
  )
}

function ShareButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-secondary text-xs touch-manipulation"
    >
      {label}
    </a>
  )
}
