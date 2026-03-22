'use client'

import type { FinalVerdict } from '@/lib/types'
import { GuildLeaderboard } from './guilt-leaderboard'
import { getSiteUrl, BASE_PATH } from '@/lib/constants'

interface VerdictScreenProps {
  verdict: FinalVerdict
  crime: string
}

export function VerdictScreen({ verdict, crime }: VerdictScreenProps) {
  const shareUrl = `${getSiteUrl()}${BASE_PATH}/result/${verdict.resultId}`
  const shareText = `${verdict.convictName} found GUILTY of "${crime}" — Sentenced to: ${verdict.sentence}`

  return (
    <div>
      {/* Guilty stamp */}
      <div className="card border-danger mb-6 p-6 text-center">
        <div className="guilty-stamp mb-4 inline-block">GUILTY</div>
        <p className="text-2xl font-black">{verdict.convictName}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          &ldquo;{crime}&rdquo;
        </p>
      </div>

      {/* Sentence */}
      <div className="card mb-4 border-primary p-4 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Sentence
        </p>
        <p className="mt-1 text-lg font-bold text-primary">
          {verdict.sentence}
        </p>
      </div>

      {/* Explanation */}
      <div className="card mb-4 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {verdict.explanation}
        </p>
      </div>

      {/* Final guilt scores */}
      <div className="mb-6">
        <GuildLeaderboard scores={verdict.scores} />
      </div>

      {/* Share buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary touch-manipulation"
        >
          Share on WhatsApp
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary touch-manipulation"
        >
          Share on LinkedIn
        </a>
      </div>

      {/* Play again */}
      <div className="mt-6 text-center">
        <a
          href={`${BASE_PATH}/`}
          className="btn btn-secondary touch-manipulation"
        >
          Create New Room
        </a>
      </div>
    </div>
  )
}
