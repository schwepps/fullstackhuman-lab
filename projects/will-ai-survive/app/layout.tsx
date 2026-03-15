import type { Metadata, Viewport } from 'next'
import { getSiteUrl } from '@/lib/constants'
import './globals.css'

export const metadata: Metadata = {
  title: 'Will AI Survive This Job? | FullStackHuman',
  description:
    'Describe your workplace chaos. AI will try to survive it — and probably fail dramatically.',
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: 'Will AI Survive This Job?',
    description:
      'Describe your workplace chaos. AI will try to survive it — and probably fail dramatically.',
    siteName: 'FullStackHuman',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Will AI Survive This Job?',
    description:
      'Describe your workplace chaos. AI will try to survive it — and probably fail dramatically.',
  },
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
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
      <body className="min-h-svh pb-safe antialiased">{children}</body>
    </html>
  )
}
