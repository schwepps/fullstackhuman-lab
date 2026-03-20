import { ImageResponse } from '@vercel/og'
import { getResult } from '@/lib/result-store'

export const runtime = 'edge'

const WIDTH = 1200
const HEIGHT = 630

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resultId = searchParams.get('resultId')

  if (resultId) {
    const result = await getResult(resultId)
    if (result) {
      return new ImageResponse(
        <ConvictionCard
          convictName={result.convictName}
          crimeText={result.crimeText}
          winningAccuserName={result.winningAccuserName}
          evidence={result.winningEvidence.slice(0, 150)}
        />,
        { width: WIDTH, height: HEIGHT }
      )
    }
  }

  // Default OG image
  return new ImageResponse(<DefaultCard />, {
    width: WIDTH,
    height: HEIGHT,
  })
}

function DefaultCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        padding: '60px',
      }}
    >
      <div
        style={{
          fontSize: '80px',
          fontWeight: 900,
          color: '#FF6B00',
          letterSpacing: '-0.02em',
        }}
      >
        JAILNABI
      </div>
      <div
        style={{
          fontSize: '28px',
          color: '#a0a0a0',
          marginTop: '16px',
        }}
      >
        Where no one is innocent
      </div>
      <div
        style={{
          fontSize: '18px',
          color: '#6b6b6b',
          marginTop: '32px',
        }}
      >
        A daily AI accusation game for Hanabi
      </div>
    </div>
  )
}

function ConvictionCard({
  convictName,
  crimeText,
  winningAccuserName,
  evidence,
}: {
  convictName: string
  crimeText: string
  winningAccuserName: string
  evidence: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        padding: '60px',
        position: 'relative',
      }}
    >
      {/* CONVICTED stamp */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          right: '60px',
          color: '#e74c3c',
          fontSize: '48px',
          fontWeight: 900,
          letterSpacing: '0.1em',
          border: '4px solid #e74c3c',
          padding: '4px 24px',
          transform: 'rotate(-12deg)',
        }}
      >
        CONVICTED
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#FF6B00',
          marginBottom: '24px',
        }}
      >
        JAILNABI
      </div>

      {/* Convict name */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#ffffff',
          marginBottom: '16px',
        }}
      >
        {convictName}
      </div>

      {/* Crime */}
      <div
        style={{
          fontSize: '20px',
          color: '#a0a0a0',
          marginBottom: '24px',
        }}
      >
        Crime: &ldquo;{crimeText}&rdquo;
      </div>

      {/* Evidence excerpt */}
      <div
        style={{
          fontSize: '16px',
          color: '#6b6b6b',
          backgroundColor: '#2d2d2d',
          padding: '16px',
          borderRadius: '8px',
          borderLeft: '3px solid #FF6B00',
          maxHeight: '120px',
          overflow: 'hidden',
        }}
      >
        {evidence}...
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '60px',
          display: 'flex',
          gap: '16px',
          fontSize: '14px',
          color: '#6b6b6b',
        }}
      >
        <span>Convicted by {winningAccuserName}</span>
        <span>•</span>
        <span>Where no one is innocent</span>
      </div>
    </div>
  )
}
