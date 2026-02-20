import { Link } from '@/i18n/routing'
import { BRAND_NAME, BRAND_NAME_SHORT } from '@/lib/constants/brand'

export function BrandLink() {
  return (
    <Link
      href="/"
      className="font-mono text-sm font-bold tracking-wider text-primary transition-colors hover:text-primary/80"
    >
      <span className="sm:hidden">{BRAND_NAME_SHORT}</span>
      <span className="hidden sm:inline">{BRAND_NAME}</span>
    </Link>
  )
}
