import { ImageResponse } from '@vercel/og'
import { getResult } from '@/lib/result-store'
import { getRoom } from '@/lib/room-manager'

export const runtime = 'edge'

const WIDTH = 1200
const HEIGHT = 630

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const resultId = searchParams.get('resultId')
  const roomCode = searchParams.get('room')

  // Room invite OG card — the viral hook
  if (roomCode) {
    const room = await getRoom(roomCode.toUpperCase())
    if (room) {
      return new ImageResponse(
        <RoomInviteCard
          crime={room.crime}
          accusation={room.initialAccusation}
          creatorName={room.creatorName}
          code={room.code}
        />,
        { width: WIDTH, height: HEIGHT }
      )
    }
  }

  if (resultId) {
    const result = await getResult(resultId)
    if (result) {
      return new ImageResponse(
        <ConvictionCard
          convictName={result.convictName}
          crimeText={result.crime}
          sentence={result.sentence}
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
  sentence,
}: {
  convictName: string
  crimeText: string
  sentence: string
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

      {/* Sentence */}
      <div
        style={{
          fontSize: '20px',
          color: '#FF6B00',
          backgroundColor: '#2d2d2d',
          padding: '16px',
          borderRadius: '8px',
          borderLeft: '3px solid #FF6B00',
        }}
      >
        Sentence: {sentence}
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '60px',
          fontSize: '14px',
          color: '#6b6b6b',
        }}
      >
        Jailnabi — Where no one is innocent
      </div>
    </div>
  )
}

function RoomInviteCard({
  crime,
  accusation,
  creatorName,
  code,
}: {
  crime: string
  accusation: string
  creatorName: string
  code: string
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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            fontSize: '32px',
            fontWeight: 900,
            color: '#FF6B00',
          }}
        >
          JAILNABI
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 900,
            color: '#FF6B00',
            letterSpacing: '0.1em',
            border: '2px solid #FF6B00',
            padding: '4px 16px',
            borderRadius: '8px',
          }}
        >
          {code}
        </div>
      </div>

      {/* Crime */}
      <div
        style={{
          fontSize: '14px',
          color: '#a0a0a0',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '8px',
        }}
      >
        THE CRIME
      </div>
      <div
        style={{
          fontSize: '36px',
          fontWeight: 900,
          color: '#ffffff',
          marginBottom: '32px',
          lineHeight: 1.2,
        }}
      >
        &ldquo;{crime}&rdquo;
      </div>

      {/* Accusation */}
      <div
        style={{
          fontSize: '18px',
          color: '#a0a0a0',
          backgroundColor: '#2d2d2d',
          padding: '20px',
          borderRadius: '8px',
          borderLeft: '3px solid #e74c3c',
          lineHeight: 1.5,
        }}
      >
        {accusation.slice(0, 200)}
        {accusation.length > 200 ? '...' : ''}
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '60px',
          right: '60px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '16px',
          color: '#6b6b6b',
        }}
      >
        <span>Accused by {creatorName}</span>
        <span>Join and defend yourself!</span>
      </div>
    </div>
  )
}
