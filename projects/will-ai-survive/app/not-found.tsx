import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-md flex-col items-start justify-center px-4">
      <p className="pixel mb-3 text-magenta">404</p>
      <h1 className="mb-3 font-display text-5xl leading-none font-extrabold tracking-tight">
        This meeting was cancelled.
      </h1>
      <p className="mb-6 text-ink-muted">
        The page you are looking for has been restructured.
      </p>
      <Link
        href="/"
        className="notch-8 pixel flex min-h-12 items-center bg-ink px-6 text-signal"
      >
        Back to your calendar
      </Link>
    </main>
  )
}
