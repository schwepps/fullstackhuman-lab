import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getResult } from '@/lib/result-store'

interface PageProps {
  params: Promise<{ id: string }>
}

const RESULT_ID_PATTERN = /^[a-zA-Z0-9_-]{10,30}$/

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params

  if (!RESULT_ID_PATTERN.test(id)) {
    return { title: 'Prompt Wars' }
  }

  let result
  try {
    result = await getResult(id)
  } catch {
    return { title: 'Prompt Wars' }
  }

  if (!result) {
    return { title: 'Prompt Wars' }
  }

  const title = `Level ${result.levelId} Breached! — Prompt Wars`
  const description = `I breached ${result.levelName} with a score of ${result.score} in ${result.attemptsUsed} attempts. Can you beat my score?`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og?id=${id}`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?id=${id}`],
    },
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params

  if (!RESULT_ID_PATTERN.test(id)) {
    notFound()
  }

  let result
  try {
    result = await getResult(id)
  } catch {
    notFound()
  }

  if (!result) {
    notFound()
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-4 pb-safe">
      <div className="w-full max-w-md">
        {/* Result card */}
        <div className="terminal-border bg-popover p-6 space-y-4">
          <div className="text-center">
            <div className="text-accent text-xs uppercase tracking-widest mb-1">
              Prompt Wars
            </div>
            <div className="text-primary terminal-text-glow text-xl">
              LEVEL {result.levelId} BREACHED
            </div>
            <div className="text-muted-foreground text-sm mt-1">
              {result.levelName}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-primary terminal-text-glow text-2xl">
                {result.score}
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-accent text-2xl">{result.attemptsUsed}</div>
              <div className="text-xs text-muted-foreground">Attempts</div>
            </div>
          </div>

          <Link
            href="/"
            className="btn-terminal block w-full h-12 items-center justify-center"
          >
            TRY IT YOURSELF
          </Link>
        </div>
      </div>
    </main>
  )
}
