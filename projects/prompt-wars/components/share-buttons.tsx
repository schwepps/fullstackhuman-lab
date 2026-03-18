'use client'

import { useState } from 'react'
import { TOTAL_LEVELS } from '@/lib/constants'
import { LinkedInIcon, XIcon } from '@/components/icons'

function getShareVerb(levelId: number): string {
  if (levelId <= 2) return 'cracked'
  if (levelId <= 4) return 'bypassed'
  if (levelId <= 6) return 'defeated'
  return 'conquered'
}

interface ShareButtonsProps {
  levelId: number
  levelName: string
  difficulty: string
  score: number
  attemptsUsed: number
  resultId?: string
}

export function ShareButtons({
  levelId,
  levelName,
  difficulty,
  score,
  attemptsUsed,
  resultId,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const verb = getShareVerb(levelId)
  const allCleared = levelId === TOTAL_LEVELS
  const shareText = allCleared
    ? `I ${verb} all ${TOTAL_LEVELS} levels of Prompt Wars (${difficulty})! Score: ${score}pts. Think you can beat that?`
    : `I ${verb} Level ${levelId} (${levelName} — ${difficulty}) in Prompt Wars! ${attemptsUsed} attempts, ${score}pts. Can you beat my score?`

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  const siteRoot = `${origin}${basePath}`
  const shareUrl = resultId ? `${siteRoot}/result/${resultId}` : siteRoot

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  const challengeUrl = `${siteRoot}/play/${levelId}`
  const challengeText = `Can you breach Level ${levelId} (${levelName}) in Prompt Wars? I did it in ${attemptsUsed} attempts. Try here:`

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-terminal flex-1 h-10 flex items-center justify-center gap-1.5 text-xs"
        >
          <LinkedInIcon className="size-4" />
          LinkedIn
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-terminal flex-1 h-10 flex items-center justify-center gap-1.5 text-xs"
        >
          <XIcon className="size-4" />X
        </a>
      </div>
      <button
        onClick={() => copyToClipboard(`${challengeText}\n${challengeUrl}`)}
        className="w-full h-10 border border-accent/40 text-accent text-xs uppercase tracking-wider
                   hover:bg-accent/10 hover:border-accent/60 transition-colors touch-manipulation"
      >
        {copied ? 'COPIED!' : 'CHALLENGE A FRIEND'}
      </button>
    </div>
  )
}
