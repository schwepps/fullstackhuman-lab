import { LocaleSwitcher } from '@/components/layout/locale-switcher'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="fixed top-0 right-0 z-40 p-4 sm:p-6">
        <LocaleSwitcher />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
