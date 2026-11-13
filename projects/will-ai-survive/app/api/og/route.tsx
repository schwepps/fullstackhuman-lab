import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getResult } from '@/lib/result-store'
import { RESULT_ID_PATTERN } from '@/lib/validation'

export const runtime = 'edge'

function ratingColor(rating: number): string {
  if (rating <= 3) return '#5fd4a3'
  if (rating <= 6) return '#f2c14e'
  return '#e0457b'
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
        backgroundColor: '#141a3a',
        color: '#f5f7fb',
        fontFamily: 'monospace',
      }}
    >
      {/* Top label */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: '#7fe0f0',
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
            color: '#a9b4d0',
          }}
        >
          CHAOS
        </span>
        <div
          style={{
            flex: 1,
            height: 24,
            backgroundColor: '#252d5c',
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
                'linear-gradient(to right, #5fd4a3, #f2c14e, #e0457b)',
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
          color: '#dbe2f2',
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
          borderTop: '1px solid #252d5c',
          paddingTop: 20,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#a9b4d0',
          }}
        >
          FullStackHuman
        </span>
        <span style={{ fontSize: 14, color: '#7fe0f0' }}>
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
