'use client'

import { useState, useCallback } from 'react'
import type { PlayerType } from '@/lib/game/types'

type LobbyPlayer = {
  id: string
  displayName: string
  avatarColor: number
}

type LobbyPanelProps = {
  isHost: boolean
  players: LobbyPlayer[]
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

export function LobbyPanel({ isHost, players, onReady }: LobbyPanelProps) {
  const [displayName, setDisplayName] = useState('')
  const [selectedType, setSelectedType] = useState<PlayerType>('human')
  const [customPrompt, setCustomPrompt] = useState('')

  const canStart =
    isHost && players.length >= 3 && displayName.trim().length > 0

  const handleStart = useCallback(() => {
    const trimmed = displayName.trim()
    if (!trimmed) return
    onReady(
      trimmed,
      selectedType,
      selectedType === 'custom-agent' ? customPrompt.trim() : undefined
    )
  }, [displayName, selectedType, customPrompt, onReady])

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4 font-mono">
      <h2 className="text-center text-xl font-bold text-[#22d3ee]">
        {'> LOBBY'}
      </h2>

      {/* Name input */}
      <div className="flex items-center gap-1">
        <span className="text-[#94a3b8]">{'>'}</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={16}
          placeholder="ENTER_CALLSIGN"
          className="h-11 flex-1 touch-manipulation border border-[#1e293b] bg-[#111118] px-3 text-base text-[#e2e8f0] placeholder-[#94a3b8] focus:border-[#22d3ee] focus:shadow-[0_0_8px_rgba(34,211,238,0.15)] focus:outline-none"
        />
      </div>

      {/* Role selection */}
      <div className="space-y-2">
        {ROLE_OPTIONS.map((role) => (
          <button
            key={role.type}
            type="button"
            onClick={() => setSelectedType(role.type)}
            className={`flex h-14 w-full touch-manipulation items-center gap-3 border px-4 text-base transition-colors active:scale-[0.98] ${
              selectedType === role.type
                ? 'border-[#22d3ee] bg-[#111118] text-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                : 'border-[#1e293b] bg-[#0a0a0c] text-[#94a3b8]'
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
          className="min-h-32 w-full touch-manipulation border border-[#1e293b] bg-[#111118] p-3 text-base text-[#e2e8f0] placeholder-[#94a3b8] focus:border-[#22d3ee] focus:outline-none"
          style={{ fontFamily: 'monospace' }}
        />
      )}

      {/* Player list */}
      <div className="space-y-1 border border-[#1e293b] bg-[#0a0a0c] p-3">
        <p className="text-xs text-[#94a3b8]">{players.length}/10 CONNECTED</p>
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: `#${p.avatarColor.toString(16).padStart(6, '0')}`,
              }}
            />
            <span className="text-[#e2e8f0]">{p.displayName}</span>
          </div>
        ))}
      </div>

      {/* Start button (host only) */}
      {isHost && (
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className={`h-11 w-full touch-manipulation font-bold transition-all active:scale-[0.98] ${
            canStart
              ? 'bg-[#22d3ee] text-[#0a0a0c] shadow-[0_0_12px_rgba(34,211,238,0.3)]'
              : 'bg-[#1e293b] text-[#94a3b8] opacity-50'
          }`}
        >
          {players.length < 3
            ? `WAITING (${players.length}/3 MIN)`
            : '> START_GAME'}
        </button>
      )}
    </div>
  )
}
