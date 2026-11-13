'use client'

import { useRef, useState } from 'react'
import {
  buildLinkedInPostText,
  buildLinkedInShareUrl,
  buildXShareUrl,
  buildWhatsAppShareUrl,
  resultUrl as buildResultUrl,
} from '@/lib/share-text'

type ShareButtonsProps = {
  resultId: string
  chaosRating: number
  chaosLabel: string
  survivalDuration: string
  breakingPoint: string
  onReset?: () => void
}

const TOAST_MS = 2000
const BUTTON =
  'notch-8 pixel flex min-h-13 flex-[1_1_180px] items-center justify-center border-2 px-5 text-[0.8125rem] touch-manipulation'
const PLAIN = `${BUTTON} border-ink bg-card text-ink`

export function ShareButtons({ onReset, ...share }: ShareButtonsProps) {
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function showToast(message: string) {
    clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS)
  }

  async function copy(text: string, copied: string, failed: string) {
    try {
      await navigator.clipboard.writeText(text)
      showToast(copied)
    } catch {
      showToast(failed)
    }
  }

  function handleLinkedIn() {
    // Copy before opening: once the new tab has focus, the clipboard write is refused
    void copy(
      buildLinkedInPostText(share),
      'Post text copied. Paste it in LinkedIn.',
      "Couldn't copy the post text."
    )
    window.open(buildLinkedInShareUrl(share), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={handleLinkedIn}
          className={`${BUTTON} border-magenta bg-magenta text-paper`}
        >
          Share on LinkedIn
        </button>
        <a
          href={buildXShareUrl(share)}
          target="_blank"
          rel="noopener noreferrer"
          className={PLAIN}
        >
          Share on X
        </a>
        <a
          href={buildWhatsAppShareUrl(share)}
          target="_blank"
          rel="noopener noreferrer"
          className={PLAIN}
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() =>
            copy(
              buildResultUrl(share.resultId),
              'Link copied',
              'Copy failed. Select the address bar instead.'
            )
          }
          className={PLAIN}
        >
          Copy link
        </button>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className={`${BUTTON} border-ink bg-ink text-signal`}
          >
            Try another job
          </button>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-muted">
        Anyone with the link can read your description, so leave out real names.
      </p>
      <p
        role="status"
        className={`notch-8 pixel fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink px-4.5 py-3 text-signal ${toast ? '' : 'hidden'}`}
      >
        {toast}
      </p>
    </div>
  )
}
