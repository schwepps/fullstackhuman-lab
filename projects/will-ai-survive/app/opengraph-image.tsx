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
        backgroundColor: '#141a3a',
        color: '#f5f7fb',
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
        <span style={{ fontSize: 80, fontWeight: 800, color: '#e0457b' }}>
          Your Job?
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 28,
          color: '#a9b4d0',
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
          color: '#7fe0f0',
          display: 'flex',
        }}
      >
        FULLSTACKHUMAN
      </div>
    </div>,
    { ...size }
  )
}
