'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

interface SubmitButtonProps {
  label: string
  loadingLabel: string
}

export function SubmitButton({ label, loadingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="h-12 w-full touch-manipulation bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] sm:h-10"
      disabled={pending}
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        label
      )}
    </Button>
  )
}
