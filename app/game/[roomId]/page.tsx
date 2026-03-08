'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import usePartySocket from 'partysocket/react'
import { GameCanvas } from '@/components/game/game-canvas'
import type { ZoneType } from '@/lib/game/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'

export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting'
  )
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [myColor, setMyColor] = useState(0x22d3ee)
  const [socket, setSocket] = useState<WebSocket | null>(null)

  const ws = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    onOpen() {
      setStatus('connected')
      setSocket(ws as unknown as WebSocket)
    },
    onMessage(event) {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'phase_change' && msg.yourPlayerId) {
          setMyPlayerId(msg.yourPlayerId)
          if (msg.yourColor) setMyColor(msg.yourColor)
        }
      } catch {
        // ignore malformed messages
      }
    },
    onClose() {
      setStatus('connecting')
      setSocket(null)
    },
    onError() {
      setStatus('error')
    },
  })

  const handlePositionUpdate = useCallback(() => {
    // Position updates handled internally by GameCanvas
  }, [])

  const handleZoneChange = useCallback((_zone: ZoneType) => {
    // Will be used by chat in Phase 6
  }, [])

  if (status !== 'connected' || !myPlayerId) {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-mono text-2xl text-[#22d3ee] sm:text-3xl">
            {status === 'error' ? (
              '> CONNECTION_ERROR'
            ) : (
              <>
                {'> INITIALIZING'}
                <span className="animate-pulse">_</span>
              </>
            )}
          </h1>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0c] p-2 sm:p-4">
      <div className="relative w-full max-w-[1200px]">
        <GameCanvas
          socket={socket}
          myPlayerId={myPlayerId}
          myColor={myColor}
          isChatFocused={false}
          onPositionUpdate={handlePositionUpdate}
          onZoneChange={handleZoneChange}
        />
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
          <span className="font-mono text-xs text-[#4ade80]">LIVE</span>
        </div>
      </div>
    </main>
  )
}
