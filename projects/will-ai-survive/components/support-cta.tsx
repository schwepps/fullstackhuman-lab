import { KOFI_URL } from '@/lib/constants'

export function SupportCta() {
  return (
    <p className="text-center text-sm text-ink-muted">
      Even AI&apos;s resignation letter costs real compute.{' '}
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-magenta underline underline-offset-2 hover:text-ink"
      >
        Help cover AI therapy bills
      </a>
    </p>
  )
}
