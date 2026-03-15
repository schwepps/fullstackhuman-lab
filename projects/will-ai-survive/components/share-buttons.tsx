'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'
import {
  buildLinkedInShareUrl,
  buildXShareUrl,
  resultUrl as buildResultUrl,
} from '@/lib/share-text'

type ShareButtonsProps = {
  resultId: string
  chaosRating: number
  chaosLabel: string
  survivalDuration: string
  breakingPoint: string
}

const NOOP_SUBSCRIBE = () => () => {}

export function ShareButtons(props: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  // Detect Web Share API: returns false on server, real value on client
  const canShare = useSyncExternalStore(
    NOOP_SUBSCRIBE,
    () => !!navigator.share,
    () => false
  )

  const url = buildResultUrl(props.resultId)
  const linkedInUrl = buildLinkedInShareUrl(props)
  const xUrl = buildXShareUrl(props)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [url])

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: 'Will AI Survive This Job?',
        text: `AI tried my job and lasted ${props.survivalDuration}. Chaos rating: ${props.chaosRating}/10`,
        url,
      })
    } catch {
      // User cancelled share
    }
  }, [props.survivalDuration, props.chaosRating, url])

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-mono text-xs uppercase tracking-wider text-muted">
        Share your results
      </p>

      <div className="grid grid-cols-3 gap-2">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn (opens in new tab)"
          className="btn-corporate text-center"
        >
          LinkedIn
        </a>

        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (opens in new tab)"
          className="btn-corporate text-center"
        >
          X / Twitter
        </a>

        <button
          onClick={handleCopy}
          aria-live="polite"
          className="min-h-11 touch-manipulation border border-border px-4 py-3 font-mono text-sm transition-colors hover:bg-surface-dim active:scale-[0.98]"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {canShare && (
        <button
          onClick={handleNativeShare}
          className="min-h-11 w-full touch-manipulation border border-border px-4 py-3 font-mono text-sm transition-colors hover:bg-surface-dim active:scale-[0.98]"
        >
          Share...
        </button>
      )}
    </div>
  )
}
