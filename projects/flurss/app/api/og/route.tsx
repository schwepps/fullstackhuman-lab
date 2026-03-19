import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a0a0a',
        padding: 60,
        position: 'relative',
      }}
    >
      {/* Red border frame */}
      <div
        style={{
          position: 'absolute',
          inset: 16,
          border: '4px solid #cc0000',
          display: 'flex',
        }}
      />

      {/* Gold inner frame */}
      <div
        style={{
          position: 'absolute',
          inset: 24,
          border: '1px solid #d4a017',
          display: 'flex',
        }}
      />

      {/* Star */}
      <div
        style={{
          fontSize: 60,
          color: '#cc0000',
          marginBottom: 8,
          display: 'flex',
        }}
      >
        {'\u2605'}
      </div>

      {/* SINEWS title */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: '#f5e6d0',
          letterSpacing: '12px',
          marginBottom: 8,
          display: 'flex',
        }}
      >
        SINEWS
      </div>

      {/* Gold line */}
      <div
        style={{
          width: 400,
          height: 2,
          background:
            'linear-gradient(to right, transparent, #d4a017, transparent)',
          marginBottom: 16,
          display: 'flex',
        }}
      />

      {/* Tagline */}
      <div
        style={{
          fontSize: 22,
          color: '#d4a017',
          letterSpacing: '6px',
          marginBottom: 32,
          textTransform: 'uppercase',
          display: 'flex',
        }}
      >
        Agence de presse du FlURSS
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 28,
          color: '#f5e6d0',
          opacity: 0.7,
          textAlign: 'center',
          maxWidth: 800,
          lineHeight: 1.4,
          display: 'flex',
        }}
      >
        {"Le premier et unique site d'information approuvé par le Parti"}
      </div>

      {/* Bottom stars */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          fontSize: 18,
          color: '#cc0000',
          letterSpacing: '16px',
          display: 'flex',
        }}
      >
        {'\u2605 \u2605 \u2605'}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    }
  )
}
