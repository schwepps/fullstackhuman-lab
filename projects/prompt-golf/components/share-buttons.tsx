'use client'

import { useState } from 'react'

interface ShareButtonsProps {
  challengeName: string
  holeName: string
  prompt: string
  wordCount: number
  label: string
  resultId?: string
}

export function ShareButtons({
  challengeName,
  holeName,
  prompt,
  wordCount,
  label,
  resultId,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState<'idle' | 'copied' | 'failed'>('idle')

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  const siteRoot = `${origin}${basePath}`
  const shareUrl = resultId ? `${siteRoot}/result/${resultId}` : siteRoot

  const shareText = `I got Claude to write ${challengeName} with just "${prompt}" (${wordCount} words, ${label}). Can you do better?`

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  const challengeText = `Prompt Golf — ${holeName}: Can you describe ${challengeName} in fewer than ${wordCount} words? I got "${prompt}". Try here:`

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied('copied')
      setTimeout(() => setCopied('idle'), 2000)
    } catch {
      setCopied('failed')
      setTimeout(() => setCopied('idle'), 2000)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-club flex h-11 flex-1 items-center justify-center gap-1.5 text-xs"
        >
          <LinkedInIcon />
          LinkedIn
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-club flex h-11 flex-1 items-center justify-center gap-1.5 text-xs"
        >
          <XIcon />X
        </a>
      </div>
      <button
        onClick={() => copyToClipboard(`${challengeText}\n${shareUrl}`)}
        className="h-11 w-full rounded-sm border border-accent/40 font-serif text-xs uppercase tracking-wider text-accent transition-colors hover:border-accent/60 hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] touch-manipulation"
      >
        {copied === 'copied'
          ? 'Copied!'
          : copied === 'failed'
            ? 'Copy failed'
            : 'Challenge a Friend'}
      </button>
    </div>
  )
}

function LinkedInIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
