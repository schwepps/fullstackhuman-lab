import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Will AI Survive Your Job?'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px',
        backgroundColor: '#1c1917',
        color: '#fafaf9',
        fontFamily: 'monospace',
      }}
    >
      {/* Top label */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: '#78716c',
          marginBottom: 24,
          display: 'flex',
        }}
      >
        FULLSTACKHUMAN LAB
      </div>

      {/* Title */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 32,
          lineHeight: 1.15,
        }}
      >
        <span style={{ fontSize: 64, fontWeight: 800 }}>Will AI Survive</span>
        <span style={{ fontSize: 64, fontWeight: 800, color: '#dc2626' }}>
          Your Job?
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 24,
          color: '#d6d3d1',
          lineHeight: 1.5,
          marginBottom: 'auto',
          display: 'flex',
          maxWidth: 800,
        }}
      >
        Describe your workplace chaos. AI will try to survive it — and probably
        fail dramatically.
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #292524',
          paddingTop: 20,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#a8a29e',
          }}
        >
          FullStackHuman
        </span>
        <span style={{ fontSize: 14, color: '#78716c' }}>Try it now →</span>
      </div>
    </div>,
    { ...size }
  )
}
