import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Geist_Mono } from 'next/font/google'
import { getSiteUrl } from '@/lib/constants'
import './globals.css'

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Prompt Golf — Word Golf for Code | FullStackHuman',
  description:
    'Describe code in natural language. Fewest words wins. A prompt engineering game where you learn to communicate with AI — one swing at a time.',
  metadataBase: new URL(
    getSiteUrl() + (process.env.NEXT_PUBLIC_BASE_PATH ?? '')
  ),
  openGraph: {
    title: 'Prompt Golf — Word Golf for Code',
    description:
      'Can you describe a function in 5 words? Fewer words = better score. Learn prompt engineering through play.',
    siteName: 'FullStackHuman',
    type: 'website',
    images: ['/api/og'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Golf — Word Golf for Code',
    description:
      'Can you describe a function in 5 words? Fewer words = better score.',
    images: ['/api/og'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0c1a0f',
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
        className={`${playfair.variable} ${geistMono.variable} min-h-svh font-sans`}
      >
        {/* FSH-branded top bar */}
        <header className="relative z-10 flex h-11 items-center justify-between border-b border-accent/20 bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <a
              href="https://fullstackhuman.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center font-serif text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              FullStackHuman
            </a>
            <span className="text-accent/30">|</span>
            <a
              href="https://fullstackhuman.sh/lab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center font-serif text-[10px] uppercase tracking-[0.15em] transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Lab
            </a>
          </div>
          <span className="hidden font-serif text-[10px] uppercase tracking-[0.15em] text-muted-foreground sm:inline">
            Dress code: business casual or pajamas
          </span>
        </header>
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  )
}
