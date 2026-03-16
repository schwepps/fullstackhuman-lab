import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 font-mono text-6xl font-bold text-corporate">404</h1>
      <p className="mb-6 font-mono text-lg text-muted">
        This workplace has been... restructured.
      </p>
      <Link href="/" className="btn-corporate">
        Back to Safety
      </Link>
    </main>
  )
}
