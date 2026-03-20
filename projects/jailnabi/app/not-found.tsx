import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 font-mono text-6xl font-black text-primary">404</p>
      <h1 className="mb-4 text-2xl font-bold">Case Dismissed</h1>
      <p className="mb-8 text-muted-foreground">
        This case file doesn&apos;t exist. The evidence has been destroyed.
      </p>
      <Link href="/" className="btn btn-primary">
        Return to The Yard
      </Link>
    </div>
  )
}
