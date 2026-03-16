import type { Metadata, Viewport } from 'next'
import { getSiteUrl } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  title: 'Will AI Survive your job? | FullStackHuman',
  description:
    'Describe your workplace chaos. AI will try to survive it — and probably fail dramatically.',
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: 'Will AI Survive your job?',
    description:
      'Describe your workplace chaos. AI will try to survive it — and probably fail dramatically.',
    siteName: 'FullStackHuman',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Will AI Survive your job?',
    description:
      'Describe your workplace chaos. AI will try to survive it — and probably fail dramatically.',
  },
}

export const viewport: Viewport = {
  themeColor: '#f8fafc',
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
    <html lang="en">
      <body className="min-h-svh pb-safe antialiased">
        {/* FSH-branded top bar (matches sharing-layout header) */}
        <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <a
              href="https://fullstackhuman.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors hover:text-foreground"
            >
              FullStackHuman
            </a>
            <span className="text-border">|</span>
            <a
              href="https://fullstackhuman.sh/lab"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.15em] transition-colors hover:text-foreground"
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
