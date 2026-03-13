import Link from 'next/link'
import './globals.css'

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-background font-mono text-foreground antialiased">
        <div className="flex min-h-svh flex-col items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 bg-primary/10" />
              <div className="absolute inset-2 bg-primary/5" />
              <span className="relative text-5xl font-bold text-primary">
                404
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Page not found
            </h1>
            <p className="mt-4 text-muted-foreground">
              The page you are looking for does not exist.
            </p>
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-primary px-6 py-3 text-sm font-medium text-background hover:bg-primary/90"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
