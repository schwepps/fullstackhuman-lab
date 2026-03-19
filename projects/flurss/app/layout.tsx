import type { Metadata, Viewport } from 'next'
import { Oswald, Merriweather } from 'next/font/google'
import { getSiteUrl, SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'
import './globals.css'

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
})

const merriweather = Merriweather({
  variable: '--font-merriweather',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: `${SITE_NAME} — Agence de presse officielle du FlURSS | FullStackHuman`,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(
    getSiteUrl() + (process.env.NEXT_PUBLIC_BASE_PATH ?? '')
  ),
  openGraph: {
    title: `${SITE_NAME} — Le premier site de propagande du FlURSS`,
    description: SITE_DESCRIPTION,
    siteName: 'FullStackHuman',
    type: 'website',
    images: [`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/og`],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Le premier site de propagande du FlURSS`,
    description: SITE_DESCRIPTION,
    images: [`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/og`],
  },
}

export const viewport: Viewport = {
  themeColor: '#1a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${oswald.variable} ${merriweather.variable} min-h-svh`}>
        {/* FSH-branded top bar */}
        <header className="flex h-10 items-center justify-between border-b border-border/30 bg-background px-4 sm:px-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <a
              href="https://fullstackhuman.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors hover:text-primary"
            >
              FullStackHuman
            </a>
            <span className="text-border">|</span>
            <a
              href="https://fullstackhuman.sh/lab"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.15em] transition-colors hover:text-primary"
            >
              Lab
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
