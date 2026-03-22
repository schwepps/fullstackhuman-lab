import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { getSiteUrl, BASE_PATH } from '@/lib/constants'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jailnabi — Where No One Is Innocent | FullStackHuman',
  description:
    'A daily accusation game for Hanabi. Craft prompts to generate fake evidence against your colleagues. The AI judge decides who goes to jail.',
  metadataBase: new URL(getSiteUrl() + BASE_PATH),
  openGraph: {
    title: 'Jailnabi — Where No One Is Innocent',
    description:
      'Craft AI prompts to generate fake evidence against your colleagues. One convict per day.',
    siteName: 'FullStackHuman',
    type: 'website',
    images: ['/api/og'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jailnabi — Where No One Is Innocent',
    description:
      'Craft AI prompts to generate fake evidence against your colleagues.',
    images: ['/api/og'],
  },
}

export const viewport: Viewport = {
  themeColor: '#1e1e1e',
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
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-svh font-sans`}
      >
        {/* FSH-branded top bar */}
        <header className="relative z-10 flex h-11 items-center justify-between border-b border-primary/20 bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <a
              href="https://fullstackhuman.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center text-[10px] font-semibold uppercase tracking-[0.15em] touch-manipulation transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              FullStackHuman
            </a>
            <span className="text-primary/30">|</span>
            <a
              href="https://fullstackhuman.sh/lab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center text-[10px] uppercase tracking-[0.15em] touch-manipulation transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Lab
            </a>
          </div>
          <span className="hidden text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:inline">
            Where no one is innocent
          </span>
        </header>
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  )
}
