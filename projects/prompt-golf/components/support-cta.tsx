'use client'

import Link from 'next/link'
import { KOFI_URL, COST_PER_SWING, COST_PER_PRACTICE } from '@/lib/constants'

interface SupportCtaProps {
  variant: 'inline' | 'card'
  isPractice?: boolean
}

export function SupportCta({ variant, isPractice }: SupportCtaProps) {
  const cost = isPractice ? COST_PER_PRACTICE : COST_PER_SWING
  const costLabel = `~$${cost.toFixed(3)}`

  if (variant === 'inline') {
    return (
      <div className="py-2 text-xs text-muted-foreground/60">
        <span className="text-accent/30">{'\u26F3'} </span>
        This swing cost {costLabel} in AI calls.{' '}
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent/70 transition-colors hover:text-accent"
        >
          Help keep the fairway open
        </a>
      </div>
    )
  }

  return (
    <Link
      href="/support"
      className="club-card block p-3 text-center text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent touch-manipulation"
    >
      <span className="font-serif uppercase tracking-wider">
        Support Prompt Golf
      </span>
      <span className="mt-1 block text-xs text-muted-foreground/60">
        Help cover AI costs — voluntary, always free to play
      </span>
    </Link>
  )
}
