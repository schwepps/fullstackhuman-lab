import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function NotFound() {
  return (
    <main className="min-h-[80svh] flex flex-col items-center justify-center px-4 text-center">
      <Logo className="max-w-xs mb-8" />

      <h1
        className="text-6xl sm:text-8xl font-bold text-primary mb-4"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        404
      </h1>

      <p
        className="text-lg sm:text-xl text-foreground/80 uppercase tracking-wider mb-2"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Camarade, vous avez devie de la ligne du Parti
      </p>

      <p className="text-sm text-muted max-w-md mb-8">
        Cette page n&apos;existe pas, ou a ete supprimee par le Comite Central
        pour des raisons de securite nationale. Votre tentative d&apos;acces a
        ete enregistree.
      </p>

      <Link href="/" className="btn-propaganda">
        ★ Retourner a la ligne du Parti ★
      </Link>
    </main>
  )
}
