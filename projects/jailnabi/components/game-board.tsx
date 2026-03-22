'use client'

import { useState, useEffect } from 'react'
import type {
  Room,
  Player,
  RoundMessage,
  GuiltScore,
  AISkill,
} from '@/lib/types'
import { TOTAL_ROUNDS } from '@/lib/constants'
import { MessageForm } from './message-form'
import { GuildLeaderboard } from './guilt-leaderboard'

interface GameBoardProps {
  room: Room
  players: Player[]
  messages: RoundMessage[]
  scores: GuiltScore[]
  skill: AISkill | null
  aiTip: string | null
  sessionId: string
  onRefresh: () => void
}

export function GameBoard({
  room,
  players,
  messages,
  scores,
  skill,
  aiTip,
  sessionId,
  onRefresh,
}: GameBoardProps) {
  const hasSubmitted = messages.some((m) => m.sessionId === sessionId)
  const allSubmitted = messages.length >= players.length
  const accusedPlayer =
    room.initialAccusedIndex !== null ? players[room.initialAccusedIndex] : null

  return (
    <div>
      {/* Round indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full ${
                i + 1 < room.currentRound
                  ? 'bg-primary'
                  : i + 1 === room.currentRound
                    ? 'bg-primary animate-[pulse-orange_2s_ease-in-out_infinite]'
                    : 'bg-border'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {room.roundDeadline && (
            <CountdownTimer deadline={room.roundDeadline} />
          )}
          <span className="text-xs font-semibold text-muted-foreground">
            Round {room.currentRound}/{TOTAL_ROUNDS}
          </span>
        </div>
      </div>

      {/* Crime */}
      <div className="card mb-4 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          The Crime
        </p>
        <p className="mt-1 text-lg font-bold">&ldquo;{room.crime}&rdquo;</p>
        {accusedPlayer && (
          <p className="mt-1 text-sm text-danger">
            Initially accused: {accusedPlayer.name}
          </p>
        )}
      </div>

      {/* AI Skill tip */}
      {skill && (
        <div className="card mb-4 border-primary bg-primary-muted p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI Skill: {skill.name}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{skill.tip}</p>
        </div>
      )}

      {/* Guilt leaderboard */}
      {scores.length > 0 && (
        <div className="mb-4">
          <GuildLeaderboard scores={scores} />
        </div>
      )}

      {/* AI Tip from previous round */}
      {aiTip && (
        <div className="card mb-4 border-accent bg-accent-muted p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            AI Tip
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{aiTip}</p>
        </div>
      )}

      {/* Messages from this round */}
      {messages.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Evidence Filed ({messages.length}/{players.length})
          </h3>
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.sessionId} className="card p-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary">
                    {msg.playerName}
                    {msg.isDefense ? ' (Defense)' : ''}
                  </span>
                  {msg.targetName && (
                    <span className="text-danger">vs {msg.targetName}</span>
                  )}
                </div>
                <div className="evidence-card border-l-primary bg-surface">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {msg.generatedContent}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message form or waiting state */}
      {!hasSubmitted ? (
        <MessageForm
          roomCode={room.code}
          sessionId={sessionId}
          players={players}
          onComplete={onRefresh}
        />
      ) : !allSubmitted ? (
        <div className="card p-4 text-center">
          <p className="text-sm text-muted-foreground animate-[pulse-orange_2s_ease-in-out_infinite]">
            Waiting for other players... ({messages.length}/{players.length})
          </p>
        </div>
      ) : null}
    </div>
  )
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = new Date(deadline).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 1000))
  })
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(deadline).getTime() - Date.now()
      const remaining = Math.max(0, Math.ceil(diff / 1000))
      setSecondsLeft(remaining)

      // Announce only at key thresholds (30s, 10s, 0s)
      if (remaining === 30) setAnnouncement('30 seconds remaining')
      else if (remaining === 10) setAnnouncement('10 seconds remaining')
      else if (remaining === 0) setAnnouncement('Time is up')
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const isUrgent = secondsLeft <= 30

  return (
    <>
      <span
        role="timer"
        className={`font-mono text-xs font-bold ${isUrgent ? 'text-danger animate-[pulse-orange_1s_ease-in-out_infinite]' : 'text-muted-foreground'}`}
        aria-label={`${minutes} minutes ${seconds} seconds remaining`}
      >
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
      {/* Screen reader announcements only at key thresholds */}
      <span className="sr-only" aria-live="assertive">
        {announcement}
      </span>
    </>
  )
}
