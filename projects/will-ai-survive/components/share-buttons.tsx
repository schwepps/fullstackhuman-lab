'use client'

import { useState, useSyncExternalStore } from 'react'
import {
  buildLinkedInPostText,
  buildLinkedInShareUrl,
  buildXShareUrl,
  buildWhatsAppShareUrl,
  buildNativeShareData,
  resultUrl as buildResultUrl,
} from '@/lib/share-text'
import {
  LinkedInIcon,
  XIcon,
  WhatsAppIcon,
  ShareIcon,
  ClipboardIcon,
  CheckIcon,
} from './icons'

type ShareButtonsProps = {
  resultId: string
  chaosRating: number
  chaosLabel: string
  survivalDuration: string
  breakingPoint: string
}

const subscribe = () => () => {}

const outlineBtnClass =
  'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-foreground shadow-sm transition-all hover:border-muted hover:bg-surface-dim hover:shadow-md active:scale-[0.98]'

export function ShareButtons(props: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [linkedInCopied, setLinkedInCopied] = useState(false)

  const canNativeShare = useSyncExternalStore(
    subscribe,
    () => !!navigator.share,
    () => false
  )

  const url = buildResultUrl(props.resultId)
  const xUrl = buildXShareUrl(props)
  const whatsAppUrl = buildWhatsAppShareUrl(props)

  async function handleLinkedIn() {
    // Open share dialog synchronously to avoid popup blockers
    window.open(buildLinkedInShareUrl(props), '_blank', 'noopener,noreferrer')
    // Then copy pre-written post text to clipboard
    try {
      await navigator.clipboard.writeText(buildLinkedInPostText(props))
    } catch {
      // Silent fallback — share dialog already opened
    }
    setLinkedInCopied(true)
    setTimeout(() => setLinkedInCopied(false), 3000)
  }

  async function handleNativeShare() {
    try {
      await navigator.share(buildNativeShareData(props))
    } catch {
      // User cancelled or API unavailable — no-op
    }
  }

  async function handleCopy() {
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
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Share Your Incident Report
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* LinkedIn — copies post text + opens share dialog */}
        <button
          onClick={handleLinkedIn}
          aria-label="Share on LinkedIn (copies post text and opens LinkedIn)"
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0a66c2] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#004182] hover:shadow-md active:scale-[0.98]"
        >
          <LinkedInIcon className="size-4" />
          LinkedIn
        </button>

        {/* X / Twitter */}
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (opens in new tab)"
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98]"
        >
          <XIcon className="size-4" />X / Twitter
        </a>

        {/* WhatsApp */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp (opens in new tab)"
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#1da851] hover:shadow-md active:scale-[0.98]"
        >
          <WhatsAppIcon className="size-4" />
          WhatsApp
        </a>

        {/* Native Share (mobile) or Copy Link (desktop) */}
        {canNativeShare ? (
          <button
            onClick={handleNativeShare}
            aria-label="Share via system share sheet"
            className={outlineBtnClass}
          >
            <ShareIcon className="size-4" />
            Share
          </button>
        ) : (
          <button
            onClick={handleCopy}
            aria-live="polite"
            className={outlineBtnClass}
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
        )}
      </div>

      {/* LinkedIn clipboard feedback */}
      {linkedInCopied && (
        <p className="text-center text-xs text-muted-foreground">
          Post text copied — paste it in LinkedIn!
        </p>
      )}
    </div>
  )
}
