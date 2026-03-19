import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a0a0a',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Radial glow behind center */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          left: '200px',
          right: '200px',
          height: '500px',
          background:
            'radial-gradient(ellipse at center, rgba(204,0,0,0.15) 0%, transparent 70%)',
          display: 'flex',
        }}
      />

      {/* Red banner stripe top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          backgroundColor: '#cc0000',
          display: 'flex',
        }}
      />

      {/* Red banner stripe bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          backgroundColor: '#cc0000',
          display: 'flex',
        }}
      />

      {/* Gold corner accents — top left */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: 50,
          height: 50,
          borderTop: '3px solid #d4a017',
          borderLeft: '3px solid #d4a017',
          display: 'flex',
        }}
      />
      {/* top right */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 50,
          height: 50,
          borderTop: '3px solid #d4a017',
          borderRight: '3px solid #d4a017',
          display: 'flex',
        }}
      />
      {/* bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          width: 50,
          height: 50,
          borderBottom: '3px solid #d4a017',
          borderLeft: '3px solid #d4a017',
          display: 'flex',
        }}
      />
      {/* bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 50,
          height: 50,
          borderBottom: '3px solid #d4a017',
          borderRight: '3px solid #d4a017',
          display: 'flex',
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '50px 80px',
        }}
      >
        {/* Red star via SVG */}
        <svg
          width="60"
          height="58"
          viewBox="0 0 60 58"
          style={{ marginBottom: 8 }}
        >
          <polygon
            points="30,0 37,20 58,22 42,36 47,57 30,46 13,57 18,36 2,22 23,20"
            fill="#cc0000"
            stroke="#d4a017"
            strokeWidth="1.5"
          />
        </svg>

        {/* SINEWS title with red shadow */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: '#f5e6d0',
            letterSpacing: '14px',
            display: 'flex',
            textShadow: '3px 3px 0px #cc0000',
          }}
        >
          SINEWS
        </div>

        {/* Gold double line */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 480,
              height: 3,
              backgroundColor: '#d4a017',
              display: 'flex',
            }}
          />
          <div
            style={{
              width: 440,
              height: 1,
              backgroundColor: '#cc0000',
              display: 'flex',
            }}
          />
        </div>

        {/* Tagline in red banner */}
        <div
          style={{
            backgroundColor: '#cc0000',
            padding: '10px 36px',
            marginBottom: 20,
            display: 'flex',
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: '#f5e6d0',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              fontWeight: 700,
              display: 'flex',
            }}
          >
            {'//  AGENCE DE PRESSE OFFICIELLE DU FlURSS  //'}
          </div>
        </div>

        {/* Slogan */}
        <div
          style={{
            fontSize: 22,
            color: '#d4a017',
            textAlign: 'center',
            maxWidth: 650,
            lineHeight: 1.5,
            fontStyle: 'italic',
            display: 'flex',
          }}
        >
          {"« L'information est une arme. Maniez-la avec le Parti. »"}
        </div>
      </div>

      {/* Bottom URL */}
      <div
        style={{
          position: 'absolute',
          bottom: 30,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 1,
            backgroundColor: '#d4a017',
            display: 'flex',
          }}
        />
        <div
          style={{
            fontSize: 13,
            color: '#8a7060',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          fullstackhuman.sh/lab/flurss
        </div>
        <div
          style={{
            width: 40,
            height: 1,
            backgroundColor: '#d4a017',
            display: 'flex',
          }}
        />
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
