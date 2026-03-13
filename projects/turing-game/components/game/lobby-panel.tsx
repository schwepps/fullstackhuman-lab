'use client'

import { useState, useCallback, useEffect } from 'react'
import type { PlayerType, LobbyPlayer } from '@/lib/game/types'
import { MAX_PLAYERS_PER_ROOM } from '@/lib/game/constants'

type LobbyPanelProps = {
  roomId: string
  isHost: boolean
  players: LobbyPlayer[]
  lobbyError: string | null
  onReady: (
    displayName: string,
    type: PlayerType,
    customPrompt?: string
  ) => void
}

const ROLE_OPTIONS: Array<{ type: PlayerType; label: string; icon: string }> = [
  { type: 'human', label: 'HUMAN', icon: '🧑' },
  { type: 'custom-agent', label: 'CUSTOM_AGENT', icon: '🤖' },
  { type: 'spectator', label: 'SPECTATOR', icon: '👁️' },
]

const BOOT_LINES = [
  '> INITIALIZING TURING PROTOCOL...',
  '> DEPLOYING AI AGENTS...',
  '> CALIBRATING DECEPTION MODULES...',
  '> SCANNING FOR HUMANS...',
  '> ESTABLISHING SECURE CHANNELS...',
  '> GAME READY_',
]

function BootSequence() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) return
    const delay = 300 + Math.random() * 400
    const timer = setTimeout(() => setVisibleLines((v) => v + 1), delay)
    return () => clearTimeout(timer)
  }, [visibleLines])

  return (
    <div className="mx-auto w-full max-w-md space-y-2 p-4 font-mono">
      {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
        <p
          key={i}
          className={`text-sm transition-opacity duration-300 ${
            i === visibleLines - 1 ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {line}
        </p>
      ))}
      {visibleLines < BOOT_LINES.length && (
        <span className="inline-block h-4 w-2 animate-pulse bg-primary" />
      )}
    </div>
  )
}

export function LobbyPanel({
  roomId,
  isHost,
  players,
  lobbyError,
  onReady,
}: LobbyPanelProps) {
  const [displayName, setDisplayName] = useState('')
  const [selectedType, setSelectedType] = useState<PlayerType>('human')
  const [customPrompt, setCustomPrompt] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // If there's a lobby error, the server rejected the start — override isStarting
  const effectiveStarting = isStarting && !lobbyError

  // Solo human not allowed — must have 2+ players or pick custom-agent/spectator
  const isSoloHuman = isHost && selectedType === 'human' && players.length < 2

  const hasName = displayName.trim().length > 0

  const canStart = isHost && hasName && !effectiveStarting && !isSoloHuman

  const canReady = !isHost && hasName && !isReady

  const handleStart = useCallback(() => {
    const trimmed = displayName.trim()
    if (!trimmed) return
    setIsStarting(true)
    onReady(
      trimmed,
      selectedType,
      selectedType === 'custom-agent' ? customPrompt.trim() : undefined
    )
  }, [displayName, selectedType, customPrompt, onReady])

  const handleReady = useCallback(() => {
    const trimmed = displayName.trim()
    if (!trimmed) return
    setIsReady(true)
    onReady(
      trimmed,
      selectedType,
      selectedType === 'custom-agent' ? customPrompt.trim() : undefined
    )
  }, [displayName, selectedType, customPrompt, onReady])

  if (effectiveStarting) {
    return <BootSequence />
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4 font-mono">
      <h2 className="text-center text-xl font-bold text-primary">
        {'> LOBBY'}
      </h2>

      {/* Room code */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">ROOM:</span>
        <span className="text-sm font-bold uppercase text-foreground">
          {roomId}
        </span>
        <button
          type="button"
          onClick={() => {
            const url = `${window.location.origin}/${roomId}`
            navigator.clipboard.writeText(url).catch(() => {})
          }}
          className="touch-manipulation border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary active:scale-[0.95]"
        >
          COPY_URL
        </button>
      </div>

      {/* Name input */}
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">{'>'}</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={16}
          placeholder="ENTER_CALLSIGN"
          className="h-11 flex-1 touch-manipulation border border-border bg-popover px-3 text-base text-foreground placeholder-muted-foreground focus:border-primary focus:shadow-[0_0_8px_rgba(34,211,238,0.15)] focus:outline-none"
        />
      </div>

      {/* Role selection — host cannot be spectator */}
      <div className="space-y-2">
        {ROLE_OPTIONS.filter(
          (role) => !(isHost && role.type === 'spectator')
        ).map((role) => (
          <button
            key={role.type}
            type="button"
            onClick={() => setSelectedType(role.type)}
            className={`flex h-14 w-full touch-manipulation items-center gap-3 border px-4 text-base transition-colors active:scale-[0.98] ${
              selectedType === role.type
                ? 'border-primary bg-popover text-primary shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            <span className="text-xl">{role.icon}</span>
            <span className="font-bold">{role.label}</span>
          </button>
        ))}
      </div>

      {/* Custom prompt textarea */}
      {selectedType === 'custom-agent' && (
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Paste your agent system prompt..."
          className="min-h-32 w-full touch-manipulation border border-border bg-popover p-3 text-base text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          style={{ fontFamily: 'monospace' }}
        />
      )}

      {/* Player count */}
      <div className="border border-border bg-background p-3">
        <p className="text-sm text-muted-foreground">
          {players.length}/{MAX_PLAYERS_PER_ROOM} CONNECTED
        </p>
      </div>

      {/* Hint message when button is disabled */}
      {isHost && isSoloHuman && (
        <div className="border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
          {'> '}Playing as human requires 2+ players. Switch to CUSTOM_AGENT for
          solo testing.
        </div>
      )}

      {/* Action button — host starts game, non-host submits name */}
      {isHost ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className={`h-11 w-full touch-manipulation font-bold transition-all active:scale-[0.98] ${
            canStart
              ? 'bg-primary text-background shadow-[0_0_12px_rgba(34,211,238,0.3)]'
              : 'bg-muted text-muted-foreground opacity-50'
          }`}
        >
          {!hasName
            ? 'ENTER_CALLSIGN'
            : isSoloHuman
              ? 'NEED_MORE_PLAYERS'
              : '> START_GAME'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleReady}
          disabled={!canReady}
          className={`h-11 w-full touch-manipulation font-bold transition-all active:scale-[0.98] ${
            canReady
              ? 'bg-primary text-background shadow-[0_0_12px_rgba(34,211,238,0.3)]'
              : 'bg-muted text-muted-foreground opacity-50'
          }`}
        >
          {isReady
            ? 'WAITING_FOR_HOST'
            : !hasName
              ? 'ENTER_CALLSIGN'
              : '> READY'}
        </button>
      )}
    </div>
  )
}
