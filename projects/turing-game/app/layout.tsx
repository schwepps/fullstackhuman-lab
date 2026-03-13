import type { Metadata, Viewport } from 'next'
import { LandscapeHint } from '@/components/game/landscape-hint'
import './globals.css'

export const metadata: Metadata = {
  title: 'Turing Game | FullStackHuman',
  description: 'A multiplayer Turing test game — spot the AI imposters',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className="bg-background font-mono text-foreground antialiased"
        style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
      >
        {children}
        <LandscapeHint />
      </body>
    </html>
  )
}
