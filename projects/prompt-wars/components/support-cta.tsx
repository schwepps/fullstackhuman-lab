'use client'

import Link from 'next/link'
import { KOFI_URL, COST_PER_ATTEMPT } from '@/lib/constants'

interface SupportCtaProps {
  variant: 'inline' | 'card'
  levelId?: number
}

export function SupportCta({ variant, levelId }: SupportCtaProps) {
  const cost = levelId ? COST_PER_ATTEMPT[levelId] : null
  const costLabel = cost != null ? `~$${cost.toFixed(3)}` : null

  if (variant === 'inline') {
    return (
      <div className="text-xs text-muted-foreground/60 py-2">
        <span className="text-muted-foreground/40">{'>'} </span>
        {costLabel
          ? `This level cost ${costLabel} in AI calls. `
          : 'Each attempt costs real AI compute. '}
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent/70 hover:text-accent transition-colors"
        >
          Help keep the servers running
        </a>
      </div>
    )
  }

  return (
    <Link
      href="/support"
      className="block terminal-border p-3 text-center text-sm text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors touch-manipulation"
    >
      {'>'} SUPPORT PROMPT_WARS
      <span className="block text-xs text-muted-foreground/60 mt-1">
        Help cover AI costs — voluntary, always free to play
      </span>
    </Link>
  )
}
