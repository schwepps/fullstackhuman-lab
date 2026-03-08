'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import usePartySocket from 'partysocket/react'
import { GameCanvas } from '@/components/game/game-canvas'
import { ChatBubble } from '@/components/game/chat-bubble'
import { ChatInput } from '@/components/game/chat-input'
import type { ZoneType, ChatMessage } from '@/lib/game/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'

export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting'
  )
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [myColor, setMyColor] = useState(0x22d3ee)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [currentZone, setCurrentZone] = useState<ZoneType>('main')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isChatFocused, setIsChatFocused] = useState(false)

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
        if (msg.type === 'chat_message' && msg.message) {
          setMessages((prev) => [...prev, msg.message as ChatMessage])
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

  const handleZoneChange = useCallback((zone: ZoneType) => {
    setCurrentZone(zone)
  }, [])

  const handleSendChat = useCallback(
    (content: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({ type: 'chat', content, zone: currentZone })
        )
      }
    },
    [socket, currentZone]
  )

  const handleChatFocusChange = useCallback((focused: boolean) => {
    setIsChatFocused(focused)
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

  // Filter messages for current zone
  const zoneMessages = messages.filter((m) => m.zone === currentZone)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0c] p-2 sm:p-4">
      <div className="relative w-full max-w-300">
        <GameCanvas
          socket={socket}
          myPlayerId={myPlayerId}
          myColor={myColor}
          isChatFocused={isChatFocused}
          onPositionUpdate={handlePositionUpdate}
          onZoneChange={handleZoneChange}
        />
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
          <span className="font-mono text-xs text-[#4ade80]">LIVE</span>
        </div>
      </div>
      <div className="mt-2 w-full max-w-300">
        <ChatBubble messages={zoneMessages} />
        <div className="mt-1 pb-safe">
          <ChatInput
            onSend={handleSendChat}
            onFocusChange={handleChatFocusChange}
            disabled={false}
          />
        </div>
      </div>
    </main>
  )
}
