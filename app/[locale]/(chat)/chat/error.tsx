'use client'

import { ErrorFallback } from '@/components/shared/error-fallback'

export default function ChatError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      reset={reset}
      titleKey="chatTitle"
      descriptionKey="chatDescription"
    />
  )
}
