import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { getResult } from '@/lib/result-store'
import { RESULT_ID_PATTERN } from '@/lib/validation'
import { getSiteUrl } from '@/lib/constants'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id || !RESULT_ID_PATTERN.test(id)) {
    return new Response('Invalid id parameter', { status: 400 })
  }

  const result = await getResult(id)

  if (!result) {
    return new Response('Result not found', { status: 404 })
  }

  // Truncate breaking point for OG card
  const breakingPointTruncated =
    result.breakingPoint.length > 120
      ? result.breakingPoint.slice(0, 117) + '...'
      : result.breakingPoint

  const barWidth = Math.round((result.chaosRating / 10) * 100)

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
      {/* Title */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: 32,
          display: 'flex',
        }}
      >
        <span>WILL AI SURVIVE THIS JOB?</span>
      </div>

      {/* Chaos rating bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 14, color: '#a8a29e' }}>CHAOS RATING</span>
        <div
          style={{
            flex: 1,
            height: 20,
            backgroundColor: '#292524',
            borderRadius: 10,
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
              borderRadius: 10,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color:
              result.chaosRating <= 3
                ? '#16a34a'
                : result.chaosRating <= 6
                  ? '#d97706'
                  : '#dc2626',
          }}
        >
          {result.chaosRating}/10
        </span>
      </div>

      {/* Chaos label */}
      <div
        style={{
          fontSize: 18,
          fontStyle: 'italic',
          color: '#a8a29e',
          marginBottom: 32,
          display: 'flex',
        }}
      >
        &ldquo;{result.chaosLabel}&rdquo;
      </div>

      {/* Survived */}
      <div
        style={{
          fontSize: 14,
          color: '#a8a29e',
          marginBottom: 4,
          display: 'flex',
        }}
      >
        AI SURVIVED
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          marginBottom: 32,
          display: 'flex',
        }}
      >
        {result.survivalDuration}
      </div>

      {/* Breaking point */}
      <div
        style={{
          fontSize: 14,
          color: '#dc2626',
          marginBottom: 8,
          display: 'flex',
        }}
      >
        BREAKING POINT
      </div>
      <div
        style={{
          fontSize: 18,
          lineHeight: 1.4,
          marginBottom: 32,
          display: 'flex',
        }}
      >
        &ldquo;{breakingPointTruncated}&rdquo;
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #292524',
          paddingTop: 16,
        }}
      >
        <span style={{ fontSize: 14, color: '#78716c' }}>
          {getSiteUrl().replace(/^https?:\/\//, '')}
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
