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
      <div className="py-2 text-xs text-muted-foreground/80">
        <span className="text-accent/50">{'\u26F3'} </span>
        This attempt cost {costLabel} in AI calls.{' '}
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-accent transition-colors hover:text-accent-light focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
        >
          Help keep it running
        </a>
      </div>
    )
  }

  return (
    <Link
      href="/support"
      className="club-card block p-3 text-center text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background touch-manipulation"
    >
      <span className="font-serif uppercase tracking-wider">
        Support Prompt Golf
      </span>
      <span className="mt-1 block text-xs text-muted-foreground/80">
        Help cover AI costs — voluntary, always free to play
      </span>
    </Link>
  )
}
