import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100svh-2.75rem)] flex-col items-center justify-center px-4 pb-safe text-center">
      <h1 className="font-serif text-6xl font-bold text-accent">
        Out of Bounds
      </h1>
      <p className="mt-4 font-serif text-lg text-muted-foreground">
        This page doesn&apos;t exist.
      </p>
      <Link href="/" className="btn-club mt-8">
        Back to Home
      </Link>
    </div>
  )
}
