import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import { getSiteUrl } from '@/lib/constants'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Prompt Wars — Can You Break AI Defenses? | FullStackHuman',
  description:
    'A CTF-style game where you craft prompts to extract secrets from AI systems with increasingly hardened defenses. 7 levels. How far can you get?',
  metadataBase: new URL(
    getSiteUrl() + (process.env.NEXT_PUBLIC_BASE_PATH ?? '')
  ),
  openGraph: {
    title: 'Prompt Wars — Can You Break AI Defenses?',
    description:
      'Craft prompts to extract secrets from AI with 7 levels of defenses. How far can you get?',
    siteName: 'FullStackHuman',
    type: 'website',
    images: ['/api/og'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Wars — Can You Break AI Defenses?',
    description:
      'Craft prompts to extract secrets from AI with 7 levels of defenses. How far can you get?',
    images: ['/api/og'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
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
      <body className={`${geistMono.variable} min-h-svh`}>
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
