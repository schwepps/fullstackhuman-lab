'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import usePartySocket from 'partysocket/react'
import { GameCanvas } from '@/components/game/game-canvas'
import { ChatBubble } from '@/components/game/chat-bubble'
import { ChatInput } from '@/components/game/chat-input'
import type { ZoneType, ChatMessage } from '@/lib/game/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'

type TypingState = {
  playerId: string
  displayName: string
  zone: ZoneType
}

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
  const [typingPlayers, setTypingPlayers] = useState<TypingState[]>([])

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
          const chatMsg = msg.message as ChatMessage
          setMessages((prev) => {
            // If streaming, update existing message by ID
            if (chatMsg.isStreaming) {
              const idx = prev.findIndex((m) => m.id === chatMsg.id)
              if (idx >= 0) {
                const updated = [...prev]
                updated[idx] = chatMsg
                return updated
              }
            }
            // Remove streaming version if this is the final message
            const filtered = prev.filter(
              (m) => m.id !== chatMsg.id || !m.isStreaming
            )
            return [...filtered, chatMsg]
          })
        }
        if (msg.type === 'agent_typing') {
          setTypingPlayers((prev) => {
            if (msg.isTyping) {
              if (prev.some((t) => t.playerId === msg.playerId)) return prev
              return [
                ...prev,
                {
                  playerId: msg.playerId,
                  displayName: msg.playerId.slice(0, 6),
                  zone: msg.zone,
                },
              ]
            }
            return prev.filter((t) => t.playerId !== msg.playerId)
          })
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

  // Filter messages and typing indicators for current zone
  const zoneMessages = messages.filter((m) => m.zone === currentZone)
  const zoneTyping = typingPlayers
    .filter((t) => t.zone === currentZone)
    .map((t) => ({ playerId: t.playerId, displayName: t.displayName }))

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
        <ChatBubble messages={zoneMessages} typingPlayers={zoneTyping} />
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
