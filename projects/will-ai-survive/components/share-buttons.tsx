'use client'

import { useState, useCallback } from 'react'
import {
  buildLinkedInShareUrl,
  buildXShareUrl,
  resultUrl as buildResultUrl,
} from '@/lib/share-text'
import { LinkedInIcon, XIcon, ClipboardIcon, CheckIcon } from './icons'

type ShareButtonsProps = {
  resultId: string
  chaosRating: number
  chaosLabel: string
  survivalDuration: string
  breakingPoint: string
}

export function ShareButtons(props: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const url = buildResultUrl(props.resultId)
  const linkedInUrl = buildLinkedInShareUrl(props)
  const xUrl = buildXShareUrl(props)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Share Your Incident Report
      </p>

      <div className="grid grid-cols-3 gap-2">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn (opens in new tab)"
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0a66c2] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#004182] hover:shadow-md active:scale-[0.98]"
        >
          <LinkedInIcon className="size-4" />
          LinkedIn
        </a>

        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (opens in new tab)"
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98]"
        >
          <XIcon className="size-4" />X / Twitter
        </a>

        <button
          onClick={handleCopy}
          aria-live="polite"
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-foreground shadow-sm transition-all hover:border-muted hover:bg-surface-dim hover:shadow-md active:scale-[0.98]"
        >
          {copied ? (
            <>
              <CheckIcon className="size-4 text-safe" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardIcon className="size-4" />
              Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  )
}
