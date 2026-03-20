import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { getResult } from '@/lib/result-store'

export const runtime = 'edge'

const RESULT_ID_PATTERN = /^[a-zA-Z0-9_-]{10,30}$/

const BG_COLOR = '#0c1a0f'
const GREEN = '#4caf50'
const GOLD = '#c9a84c'
const CREAM = '#f5f0e8'
const MUTED = '#a8b5a0'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // Default OG image
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
          backgroundColor: BG_COLOR,
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: MUTED,
            letterSpacing: '0.3em',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          EST. 2026
        </div>
        <div
          style={{
            fontSize: 72,
            color: CREAM,
            fontWeight: 700,
            marginBottom: 24,
            display: 'flex',
          }}
        >
          Prompt Golf
        </div>
        <div
          style={{
            width: 120,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            marginBottom: 24,
            display: 'flex',
          }}
        />
        <div
          style={{
            fontSize: 28,
            color: MUTED,
            display: 'flex',
            textAlign: 'center',
          }}
        >
          Describe code in natural language. Fewest words wins.
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        headers: { 'Cache-Control': 'public, max-age=86400' },
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
          backgroundColor: BG_COLOR,
        }}
      >
        <div style={{ fontSize: 48, color: CREAM, display: 'flex' }}>
          Prompt Golf
        </div>
      </div>,
      { width: 1200, height: 630 }
    )
  }

  // Prompt-as-payload OG image
  const promptTruncated =
    result.prompt.length > 80
      ? result.prompt.slice(0, 77) + '...'
      : result.prompt

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: BG_COLOR,
        padding: 60,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 20,
          color: GOLD,
          letterSpacing: '0.15em',
          marginBottom: 8,
          display: 'flex',
        }}
      >
        PROMPT GOLF
      </div>

      {/* Hole name */}
      <div
        style={{
          fontSize: 24,
          color: MUTED,
          marginBottom: 32,
          display: 'flex',
        }}
      >
        {result.holeName} — {result.challengeName}
      </div>

      {/* The prompt (hero) */}
      <div
        style={{
          fontSize: 44,
          color: CREAM,
          marginBottom: 32,
          display: 'flex',
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        &ldquo;{promptTruncated}&rdquo;
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 60, marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 48, color: GREEN, display: 'flex' }}>
            {result.wordCount}
          </div>
          <div style={{ fontSize: 14, color: MUTED, display: 'flex' }}>
            WORDS
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 48, color: GOLD, display: 'flex' }}>
            {result.label}
          </div>
          <div style={{ fontSize: 14, color: MUTED, display: 'flex' }}>
            PAR {result.par}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          fontSize: 20,
          color: GOLD,
          display: 'flex',
        }}
      >
        Can you say it in fewer?
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    }
  )
}
