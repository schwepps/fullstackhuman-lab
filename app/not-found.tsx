import Link from 'next/link'

export default function RootNotFound() {
  return (
    <html lang="fr">
      <body>
        <div className="flex min-h-svh flex-col items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
              <span className="text-5xl font-bold">404</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Page introuvable
            </h1>
            <p className="mt-4 text-gray-500">
              La page que vous recherchez n&apos;existe pas.
            </p>
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
              >
                Retour &agrave; l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
