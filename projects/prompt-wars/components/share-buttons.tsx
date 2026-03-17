'use client'

import { useState } from 'react'

interface ShareButtonsProps {
  levelId: number
  levelName: string
  score: number
  attemptsUsed: number
  resultId?: string
}

export function ShareButtons({
  levelId,
  levelName,
  score,
  attemptsUsed,
  resultId,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareText = `I breached Level ${levelId} (${levelName}) in Prompt Wars with ${attemptsUsed} attempts! Score: ${score}pts. Can you beat my score?`
  const shareUrl = resultId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/result/${resultId}`
    : typeof window !== 'undefined'
      ? window.location.origin
      : ''

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
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
      <button onClick={handleCopy} className="btn-terminal flex-1 h-10 text-xs">
        {copied ? 'COPIED!' : 'COPY'}
      </button>
    </div>
  )
}
