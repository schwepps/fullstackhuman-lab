import type { Metadata, Viewport } from 'next'
import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  Silkscreen,
} from 'next/font/google'
import { getSiteUrl } from '@/lib/constants'
import { FshLogo } from '@/components/fsh-logo'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '800'],
  variable: '--font-bricolage',
})
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})
const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-silkscreen',
})
const FONT_VARIABLES = [bricolage, geist, geistMono, silkscreen]
  .map((font) => font.variable)
  .join(' ')

const FSH_URL = 'https://fullstackhuman.sh'

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
  themeColor: '#141a3a',
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
    <html lang="en" className={FONT_VARIABLES}>
      <body className="flex min-h-svh flex-col">
        <header className="on-ink sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-line bg-ink-deep px-4 text-paper">
          <a
            href={FSH_URL}
            className="inline-flex min-h-11 items-center gap-2 text-signal"
          >
            <FshLogo className="h-7 w-12" />
            <span className="font-display text-xl text-paper">
              FullStackHuman
            </span>
          </a>
          <nav
            aria-label="Breadcrumb"
            className="pixel hidden items-center gap-2.5 text-on-ink-muted sm:flex"
          >
            <a href={`${FSH_URL}/lab`} className="text-signal">
              Lab
            </a>
            <span aria-hidden="true">/</span>
            <span>Will AI survive</span>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="bg-ink-deep px-4 py-7 pb-safe text-sm text-on-ink-muted">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3">
            <span>FullStackHuman Lab</span>
            <span>Built to make a point about work, not people.</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
