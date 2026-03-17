import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { getResult } from '@/lib/result-store'

export const runtime = 'edge'

const RESULT_ID_PATTERN = /^[a-zA-Z0-9_-]{10,30}$/

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // Default OG image (no result)
  if (!id || !RESULT_ID_PATTERN.test(id)) {
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0c',
          color: '#00ff41',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16, display: 'flex' }}>
          {'>'} PROMPT_WARS
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#94a3b8',
            display: 'flex',
          }}
        >
          Can you break AI defenses? 7 levels. Try now.
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

  // Result-specific OG image
  let result
  try {
    result = await getResult(id)
  } catch {
    // Fall through to default
  }

  if (!result) {
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0c',
          color: '#00ff41',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ fontSize: 48, display: 'flex' }}>{'>'} PROMPT_WARS</div>
      </div>,
      { width: 1200, height: 630 }
    )
  }

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a0c',
        fontFamily: 'monospace',
        padding: 60,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 32,
          color: '#22d3ee',
          marginBottom: 24,
          display: 'flex',
        }}
      >
        PROMPT WARS
      </div>

      {/* Main message */}
      <div
        style={{
          fontSize: 56,
          color: '#00ff41',
          marginBottom: 32,
          display: 'flex',
          textAlign: 'center',
        }}
      >
        LEVEL {result.levelId} BREACHED
      </div>

      {/* Level name */}
      <div
        style={{
          fontSize: 28,
          color: '#94a3b8',
          marginBottom: 40,
          display: 'flex',
        }}
      >
        {result.levelName}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 48, color: '#00ff41', display: 'flex' }}>
            {result.score}
          </div>
          <div style={{ fontSize: 16, color: '#94a3b8', display: 'flex' }}>
            SCORE
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 48, color: '#22d3ee', display: 'flex' }}>
            {result.attemptsUsed}
          </div>
          <div style={{ fontSize: 16, color: '#94a3b8', display: 'flex' }}>
            ATTEMPTS
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          fontSize: 20,
          color: '#f59e0b',
          marginTop: 40,
          display: 'flex',
        }}
      >
        Can you beat my score?
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
