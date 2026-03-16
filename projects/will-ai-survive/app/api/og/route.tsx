import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { getResult } from '@/lib/result-store'
import { RESULT_ID_PATTERN } from '@/lib/validation'

export const runtime = 'edge'

function ratingColor(rating: number): string {
  if (rating <= 3) return '#16a34a'
  if (rating <= 6) return '#d97706'
  return '#dc2626'
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id || !RESULT_ID_PATTERN.test(id)) {
    return new Response('Invalid id parameter', { status: 400 })
  }

  const result = await getResult(id)

  if (!result) {
    return new Response('Result not found', { status: 404 })
  }

  const barWidth = Math.round((result.chaosRating / 10) * 100)
  const color = ratingColor(result.chaosRating)

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
        INCIDENT REPORT
      </div>

      {/* Hero: "AI would last [DURATION] at my job" */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          marginBottom: 36,
          lineHeight: 1.2,
        }}
      >
        <span style={{ fontSize: 38, fontWeight: 400 }}>
          AI would last&nbsp;
        </span>
        <span style={{ fontSize: 44, fontWeight: 800, color }}>
          {result.survivalDuration}
        </span>
        <span style={{ fontSize: 38, fontWeight: 400 }}>&nbsp;at my job</span>
      </div>

      {/* Chaos rating bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#a8a29e',
          }}
        >
          CHAOS
        </span>
        <div
          style={{
            flex: 1,
            height: 24,
            backgroundColor: '#292524',
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: `${barWidth}%`,
              height: '100%',
              background:
                'linear-gradient(to right, #16a34a, #d97706, #dc2626)',
              borderRadius: 12,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color,
            minWidth: 90,
            textAlign: 'right',
          }}
        >
          {result.chaosRating}/10
        </span>
      </div>

      {/* Chaos label punchline */}
      <div
        style={{
          fontSize: 22,
          fontStyle: 'italic',
          color: '#d6d3d1',
          marginBottom: 'auto',
          display: 'flex',
          lineHeight: 1.4,
        }}
      >
        &ldquo;{result.chaosLabel}&rdquo;
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
        <span style={{ fontSize: 14, color: '#78716c' }}>
          How long would AI survive YOUR job?
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    }
  )
}
