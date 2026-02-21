'use client'

import { ErrorFallback } from '@/components/shared/error-fallback'

export default function MarketingError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback reset={reset} />
}
