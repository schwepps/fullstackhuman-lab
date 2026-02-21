import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { UserMenu } from '@/components/layout/user-menu'
import { BrandLink } from '@/components/layout/brand-link'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Fixed + transparent: floats over the full-bleed hero without obscuring content */}
      <header className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-transparent px-4 sm:px-6">
        <BrandLink />
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <UserMenu />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center pt-14">
        {children}
      </main>
    </div>
  )
}
