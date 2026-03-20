import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100svh-2.5rem)] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-6xl font-bold text-accent">OB</h1>
      <p className="mt-4 font-serif text-lg text-muted-foreground">
        Out of Bounds — this hole doesn&apos;t exist.
      </p>
      <Link href="/" className="btn-club mt-8">
        Back to Clubhouse
      </Link>
    </div>
  )
}
