'use client'

import { useState } from 'react'
import { TOTAL_LEVELS } from '@/lib/constants'

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
  const [copiedAction, setCopiedAction] = useState<
    'share' | 'challenge' | null
  >(null)

  const verb = getShareVerb(levelId)
  const allCleared = levelId === TOTAL_LEVELS
  const shareText = allCleared
    ? `I ${verb} all ${TOTAL_LEVELS} levels of Prompt Wars (${difficulty})! Score: ${score}pts. Think you can beat that?`
    : `I ${verb} Level ${levelId} (${levelName} — ${difficulty}) in Prompt Wars! ${attemptsUsed} attempts, ${score}pts. Can you beat my score?`

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = resultId ? `${origin}/result/${resultId}` : origin

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  async function copyToClipboard(text: string, action: 'share' | 'challenge') {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAction(action)
      setTimeout(() => setCopiedAction(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  const challengeUrl = `${origin}/play/${levelId}`
  const challengeText = `Can you breach Level ${levelId} (${levelName}) in Prompt Wars? I did it in ${attemptsUsed} attempts. Try here:`

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-terminal flex-1 h-10 flex items-center justify-center text-xs"
        >
          LinkedIn
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-terminal flex-1 h-10 flex items-center justify-center text-xs"
        >
          X
        </a>
        <button
          onClick={() => copyToClipboard(`${shareText}\n${shareUrl}`, 'share')}
          className="btn-terminal flex-1 h-10 text-xs"
        >
          {copiedAction === 'share' ? 'COPIED!' : 'COPY'}
        </button>
      </div>
      <button
        onClick={() =>
          copyToClipboard(`${challengeText}\n${challengeUrl}`, 'challenge')
        }
        className="w-full h-10 border border-accent/40 text-accent text-xs uppercase tracking-wider
                   hover:bg-accent/10 hover:border-accent/60 transition-colors touch-manipulation"
      >
        {copiedAction === 'challenge' ? 'COPIED!' : 'CHALLENGE A FRIEND'}
      </button>
    </div>
  )
}
