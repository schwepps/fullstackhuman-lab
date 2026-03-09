'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { PartySocket } from 'partysocket'
import type {
  ZoneType,
  ChatMessage,
  GamePhase,
  GameResult,
  RevealPlayer,
  RoundResult,
  TypingState,
  LobbyPlayer,
  StoredSession,
} from '@/lib/game/types'

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? '127.0.0.1:1999'
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

export function useGameSocket(roomId: string) {
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

  // Ref for myPlayerId — used inside message handler to avoid stale closure
  const myPlayerIdRef = useRef<string | null>(null)
  useEffect(() => {
    myPlayerIdRef.current = myPlayerId
  }, [myPlayerId])

  // WebSocket connection — fresh PartySocket per mount (avoids _connectLock race in usePartySocket)
  useEffect(() => {
    let aborted = false // Prevents stale events from old sockets during Strict Mode cleanup
    const session = getExistingSession(roomId)
    const ps = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
      query: session
        ? {
            playerId: session.playerId,
            sessionToken: session.sessionToken,
          }
        : undefined,
    })

    ps.addEventListener('open', () => {
      if (aborted) return
      setStatus('connected')
      setSocket(ps as unknown as WebSocket)
    })

    ps.addEventListener('message', (event: MessageEvent) => {
      if (aborted) return
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
            setIsHost(msg.isHost ?? false)
            if (msg.sessionToken) {
              saveSession(roomId, msg.yourPlayerId, msg.sessionToken)
            }
            // Add self to lobby player list
            setLobbyPlayers((prev) => {
              if (prev.some((p) => p.id === msg.yourPlayerId)) return prev
              return [
                ...prev,
                {
                  id: msg.yourPlayerId,
                  displayName: msg.yourPlayerId.slice(0, 6),
                  avatarColor: msg.yourColor ?? 0x22d3ee,
                },
              ]
            })
          }
          if (msg.yourColor) setMyColor(msg.yourColor)
          if (msg.phase) {
            setPhase(msg.phase)
            if (msg.phase === 'vote') {
              setVoteStartedAt(Date.now())
              setVoteCount(0)
            }
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
          if (msg.playerId === myPlayerIdRef.current) {
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
    })

    ps.addEventListener('close', (event: CloseEvent) => {
      if (aborted) return
      if (event.code === 4004) {
        clearSession(roomId)
        setStatus('error')
      } else {
        setStatus('connecting')
      }
      setSocket(null)
    })

    ps.addEventListener('error', () => {
      if (aborted) return
      setStatus('error')
    })

    return () => {
      aborted = true
      ps.close()
      setSocket(null)
    }
  }, [roomId])

  const handleSetCurrentZone = useCallback((zone: ZoneType) => {
    setCurrentZone(zone)
  }, [])

  const handleSetIsChatFocused = useCallback((focused: boolean) => {
    setIsChatFocused(focused)
  }, [])

  const handleClearEliminatedName = useCallback(() => {
    setEliminatedName(null)
  }, [])

  return {
    status,
    myPlayerId,
    myColor,
    socket,
    currentZone,
    messages,
    isChatFocused,
    typingPlayers,
    phase,
    round,
    topic,
    roundStartedAt,
    lobbyPlayers,
    isHost,
    roundDuration,
    voteCount,
    totalVoters,
    voteStartedAt,
    eliminatedName,
    isEliminated,
    revealResult,
    revealPlayers,
    revealRoundResults,
    setCurrentZone: handleSetCurrentZone,
    setIsChatFocused: handleSetIsChatFocused,
    clearEliminatedName: handleClearEliminatedName,
  }
}
