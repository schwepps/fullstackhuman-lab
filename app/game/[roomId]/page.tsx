'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import usePartySocket from 'partysocket/react'
import { GameCanvas } from '@/components/game/game-canvas'
import { ChatBubble } from '@/components/game/chat-bubble'
import { ChatInput } from '@/components/game/chat-input'
import { TopicBanner } from '@/components/game/topic-banner'
import { LobbyPanel } from '@/components/game/lobby-panel'
import { VotePanel } from '@/components/game/vote-panel'
import { EliminationScreen } from '@/components/game/elimination-screen'
import { RevealScreen } from '@/components/game/reveal-screen'
import type {
  ZoneType,
  ChatMessage,
  GamePhase,
  GameResult,
  RevealPlayer,
  RoundResult,
  PlayerType,
  TypingState,
  LobbyPlayer,
  StoredSession,
} from '@/lib/game/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999'
const SESSION_KEY_PREFIX = 'game:session:'

function saveSession(roomId: string, playerId: string, sessionToken: string) {
  try {
    sessionStorage.setItem(
      `${SESSION_KEY_PREFIX}${roomId}`,
      JSON.stringify({ playerId, sessionToken })
    )
  } catch {
    // sessionStorage may be unavailable
  }
}

function getExistingSession(roomId: string): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${roomId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.playerId && parsed?.sessionToken) return parsed as StoredSession
    return null
  } catch {
    return null
  }
}

function clearSession(roomId: string) {
  try {
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${roomId}`)
  } catch {
    // sessionStorage may be unavailable
  }
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
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [round, setRound] = useState(0)
  const [topic, setTopic] = useState('')
  const [roundStartedAt, setRoundStartedAt] = useState(0)
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([])
  const [isHost, setIsHost] = useState(false)
  const [roundDuration, setRoundDuration] = useState(180)
  const [voteCount, setVoteCount] = useState(0)
  const [totalVoters, setTotalVoters] = useState(0)
  const [voteStartedAt, setVoteStartedAt] = useState(0)
  const [eliminatedName, setEliminatedName] = useState<string | null>(null)
  const [isEliminated, setIsEliminated] = useState(false)
  const [revealResult, setRevealResult] = useState<GameResult | null>(null)
  const [revealPlayers, setRevealPlayers] = useState<RevealPlayer[]>([])
  const [revealRoundResults, setRevealRoundResults] = useState<RoundResult[]>(
    []
  )

  // Build query string with session params for reconnection
  const sessionQuery = useMemo(() => {
    const existing = getExistingSession(roomId)
    if (existing) {
      return `playerId=${encodeURIComponent(existing.playerId)}&sessionToken=${encodeURIComponent(existing.sessionToken)}`
    }
    return ''
  }, [roomId])

  const ws = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    query: sessionQuery
      ? Object.fromEntries(new URLSearchParams(sessionQuery))
      : undefined,
    onOpen() {
      setStatus('connected')
      setSocket(ws as unknown as WebSocket)
    },
    onMessage(event) {
      try {
        const msg = JSON.parse(event.data)

        if (msg.type === 'reconnected') {
          setMyPlayerId(msg.yourPlayerId)
          setMyColor(msg.yourColor)
          setPhase(msg.phase)
          setRound(msg.round ?? 0)
          if (msg.topic) setTopic(msg.topic)
          if (msg.roundStartedAt) setRoundStartedAt(msg.roundStartedAt)
          return
        }

        if (msg.type === 'phase_change') {
          if (msg.yourPlayerId) {
            setMyPlayerId(msg.yourPlayerId)
            setIsHost(true) // First player is host
            // Save session for reconnection
            if (msg.sessionToken) {
              saveSession(roomId, msg.yourPlayerId, msg.sessionToken)
            }
          }
          if (msg.yourColor) setMyColor(msg.yourColor)
          if (msg.phase) {
            setPhase(msg.phase)
            if (msg.phase === 'vote') {
              setVoteStartedAt(Date.now())
              setVoteCount(0)
            }
            // Clear session on reveal/ended
            if (msg.phase === 'reveal' || msg.phase === 'ended') {
              clearSession(roomId)
            }
          }
          if (msg.round) setRound(msg.round)
          if (msg.topic) setTopic(msg.topic)
          if (msg.roundStartedAt) setRoundStartedAt(msg.roundStartedAt)
          if (msg.roundDuration) setRoundDuration(msg.roundDuration)
        }

        if (msg.type === 'player_joined' && msg.player) {
          setLobbyPlayers((prev) => {
            if (prev.some((p) => p.id === msg.player.id)) return prev
            return [
              ...prev,
              {
                id: msg.player.id,
                displayName:
                  msg.player.displayName ?? msg.player.id.slice(0, 6),
                avatarColor: msg.player.avatarColor ?? 0x22d3ee,
              },
            ]
          })
        }

        if (msg.type === 'player_left') {
          setLobbyPlayers((prev) => prev.filter((p) => p.id !== msg.playerId))
        }

        if (msg.type === 'chat_message' && msg.message) {
          const chatMsg = msg.message as ChatMessage
          setMessages((prev) => {
            if (chatMsg.isStreaming) {
              const idx = prev.findIndex((m) => m.id === chatMsg.id)
              if (idx >= 0) {
                const updated = [...prev]
                updated[idx] = chatMsg
                return updated
              }
            }
            const filtered = prev.filter(
              (m) => m.id !== chatMsg.id || !m.isStreaming
            )
            return [...filtered, chatMsg]
          })
        }

        if (msg.type === 'vote_progress') {
          setVoteCount(msg.count)
          setTotalVoters(msg.total)
        }

        if (msg.type === 'elimination') {
          setEliminatedName(msg.displayName)
          // Check if current player was eliminated
          if (msg.playerId === myPlayerId) {
            setIsEliminated(true)
          }
        }

        if (msg.type === 'reveal') {
          setPhase('reveal')
          clearSession(roomId)
          setRevealResult(msg.result)
          setRevealPlayers(msg.allPlayers ?? [])
          setRevealRoundResults(msg.roundResults ?? [])
        }

        if (msg.type === 'message_removed') {
          setMessages((prev) => prev.filter((m) => m.id !== msg.messageId))
        }

        if (msg.type === 'agent_typing') {
          setTypingPlayers((prev) => {
            if (msg.isTyping) {
              if (prev.some((t) => t.playerId === msg.playerId)) return prev
              return [
                ...prev,
                {
                  playerId: msg.playerId,
                  displayName: msg.displayName ?? msg.playerId.slice(0, 6),
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
    onClose(event) {
      // 4004 = room not found (expired) — clear stale session
      if (event.code === 4004) {
        clearSession(roomId)
        setStatus('error')
      } else {
        setStatus('connecting')
      }
      setSocket(null)
    },
    onError() {
      setStatus('error')
    },
  })

  const handlePositionUpdate = useCallback(() => {}, [])

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

  const handleVote = useCallback(
    (targetId: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'vote', targetId }))
      }
    },
    [socket]
  )

  const handleEliminationComplete = useCallback(() => {
    setEliminatedName(null)
  }, [])

  const handleLobbyReady = useCallback(
    (displayName: string, playerType: PlayerType, customPrompt?: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'ready',
            displayName,
            playerType,
            customPrompt,
          })
        )
      }
    },
    [socket]
  )

  if (status !== 'connected' || !myPlayerId) {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <div className="text-center">
          <h1 className="font-mono text-2xl text-primary sm:text-3xl">
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

  // Reveal phase
  if (phase === 'reveal' && revealResult) {
    return (
      <RevealScreen
        result={revealResult}
        allPlayers={revealPlayers}
        roundResults={revealRoundResults}
      />
    )
  }

  // Lobby phase
  if (phase === 'lobby') {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-background p-2 sm:p-4">
        <LobbyPanel
          isHost={isHost}
          players={lobbyPlayers}
          onReady={handleLobbyReady}
        />
      </main>
    )
  }

  // Filter messages and typing indicators for current zone
  const zoneMessages = messages.filter((m) => m.zone === currentZone)
  const zoneTyping = typingPlayers
    .filter((t) => t.zone === currentZone)
    .map((t) => ({ playerId: t.playerId, displayName: t.displayName }))

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-2 sm:p-4">
      {phase === 'round' && topic && (
        <div className="w-full max-w-300">
          <TopicBanner
            round={round}
            topic={topic}
            roundDuration={roundDuration}
            roundStartedAt={roundStartedAt}
          />
        </div>
      )}
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
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-mono text-xs text-accent">LIVE</span>
        </div>
      </div>
      <div className="mt-2 w-full max-w-300">
        <ChatBubble messages={zoneMessages} typingPlayers={zoneTyping} />
        <div className="mt-1 pb-safe">
          <ChatInput
            onSend={handleSendChat}
            onFocusChange={handleChatFocusChange}
            disabled={phase !== 'round'}
            placeholder={phase === 'vote' ? 'VOTING...' : undefined}
          />
        </div>
      </div>
      {phase === 'vote' && myPlayerId && !isEliminated && (
        <VotePanel
          candidates={lobbyPlayers}
          myPlayerId={myPlayerId}
          onVote={handleVote}
          voteCount={voteCount}
          totalVoters={totalVoters}
          voteStartedAt={voteStartedAt}
        />
      )}

      {eliminatedName && (
        <EliminationScreen
          displayName={eliminatedName}
          onComplete={handleEliminationComplete}
        />
      )}
    </main>
  )
}
