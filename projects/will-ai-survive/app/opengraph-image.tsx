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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1c1917',
        color: '#fafaf9',
        fontFamily: 'monospace',
        textAlign: 'center',
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1.1,
          marginBottom: 32,
        }}
      >
        <span style={{ fontSize: 80, fontWeight: 800 }}>Will AI Survive</span>
        <span style={{ fontSize: 80, fontWeight: 800, color: '#dc2626' }}>
          Your Job?
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 28,
          color: '#a8a29e',
          lineHeight: 1.5,
          display: 'flex',
          maxWidth: 800,
        }}
      >
        Describe your job. AI will try to survive it.
      </div>

      {/* Branding */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#57534e',
          display: 'flex',
        }}
      >
        FULLSTACKHUMAN
      </div>
    </div>,
    { ...size }
  )
}
