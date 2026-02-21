import { Link } from '@/i18n/routing'
import { FshIconMark, FshWordmark } from '@/components/layout/fsh-logo'

export function BrandLink() {
  return (
    <Link
      href="/"
      className="text-primary transition-colors hover:text-primary/80"
      aria-label="FULL_STACK_HUMAN"
    >
      <FshIconMark className="sm:hidden" />
      <FshWordmark className="hidden sm:block" />
    </Link>
  )
}
