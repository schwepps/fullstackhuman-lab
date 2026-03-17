import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-svh flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-primary terminal-text-glow text-4xl mb-4">404</div>
        <div className="text-muted-foreground text-sm mb-6">
          TARGET NOT FOUND
        </div>
        <Link href="/" className="btn-terminal inline-block">
          RETURN TO BASE
        </Link>
      </div>
    </main>
  )
}
