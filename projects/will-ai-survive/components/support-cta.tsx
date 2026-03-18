'use client'

import { KOFI_URL } from '@/lib/constants'

export function SupportCta() {
  return (
    <p className="text-center text-xs text-muted">
      Even AI&apos;s resignation letter costs real compute.{' '}
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2 transition-colors hover:text-foreground"
      >
        Help cover AI therapy bills
      </a>
    </p>
  )
}
