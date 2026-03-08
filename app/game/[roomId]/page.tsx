'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import usePartySocket from 'partysocket/react'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'

export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting'
  )
  const [phase, setPhase] = useState<string>('...')

  usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    onOpen() {
      setStatus('connected')
    },
    onMessage(event) {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'phase_change') {
          setPhase(msg.phase)
        }
      } catch {
        // ignore malformed messages
      }
    },
    onClose() {
      setStatus('connecting')
    },
    onError() {
      setStatus('error')
    },
  })

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="text-center">
        <h1 className="font-mono text-2xl text-[#22d3ee] sm:text-3xl">
          {status === 'connected' ? (
            <>
              {'> CONNECTED'}
              <span className="animate-pulse">_</span>
            </>
          ) : status === 'error' ? (
            '> CONNECTION_ERROR'
          ) : (
            <>
              {'> INITIALIZING'}
              <span className="animate-pulse">_</span>
            </>
          )}
        </h1>
        <p className="mt-4 text-sm text-[#94a3b8]">
          Room: {roomId} | Phase: {phase}
        </p>
        {status === 'connected' && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
            <span className="text-xs text-[#4ade80]">LIVE</span>
          </div>
        )}
      </div>
    </main>
  )
}
