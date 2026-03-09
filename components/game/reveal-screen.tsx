'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import type {
  GameResult,
  RevealPlayer,
  RoundResult,
  PlayerType,
} from '@/lib/game/types'
import { isAgentType } from '@/lib/game/types'

interface RevealScreenProps {
  result: GameResult
  allPlayers: RevealPlayer[]
  roundResults: RoundResult[]
}

function getHeadline(result: GameResult, players: RevealPlayer[]) {
  if (result.wasAllHumans) {
    return {
      text: 'YOU WERE HUNTING GHOSTS. THIS ROOM WAS 100% HUMAN.',
      color: 'text-warning',
    }
  }
  if (result.agentsSurvived.length > 0) {
    const survivor = players.find((p) => p.id === result.agentsSurvived[0])
    const name = survivor?.displayName ?? 'UNKNOWN'
    const rounds = survivor?.roundsSurvived ?? 0
    return {
      text: `THE AI WON. ${name} SURVIVED ${rounds} ROUNDS UNDETECTED.`,
      color: 'text-destructive',
    }
  }
  return {
    text: 'HUMANS WIN. ALL AIs ELIMINATED.',
    color: 'text-accent',
  }
}

function getRoleDisplay(type: PlayerType) {
  switch (type) {
    case 'auto-agent':
    case 'custom-agent':
      return { label: 'AGENT', color: 'text-destructive' }
    case 'spectator':
      return { label: 'SPECTATOR', color: 'text-warning' }
    default:
      return { label: 'HUMAN', color: 'text-accent' }
  }
}

function getRoleIcon(type: PlayerType) {
  switch (type) {
    case 'auto-agent':
    case 'custom-agent':
      return '\u{1F916}'
    case 'spectator':
      return '\u{1F441}\uFE0F'
    default:
      return '\u{1F9D1}'
  }
}

export function RevealScreen({
  result,
  allPlayers,
  roundResults,
}: RevealScreenProps) {
  const headline = getHeadline(result, allPlayers)
  const scores = result.scores

  return (
    <main className="min-h-svh bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="animate-glitch font-mono text-2xl text-primary sm:text-3xl">
            {'> GAME_OVER'}
          </h1>
          <p
            className={`mt-4 font-mono text-sm uppercase sm:text-base ${headline.color}`}
          >
            {headline.text}
          </p>
        </div>

        {/* Player Cards */}
        <div className="grid gap-3 lg:grid-cols-2">
          {allPlayers.map((player, i) => {
            const role = getRoleDisplay(player.type)
            const icon = getRoleIcon(player.type)
            const isAgent = isAgentType(player.type)
            const playerScore = scores[player.id]

            return (
              <div
                key={player.id}
                className="border border-primary/20 bg-popover p-4"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: `#${player.avatarColor.toString(16).padStart(6, '0')}`,
                    }}
                  />
                  <span className="font-mono font-bold text-foreground">
                    {player.displayName}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span>{icon}</span>
                  <span className={`font-mono text-sm ${role.color}`}>
                    {role.label}
                  </span>
                </div>
                <div className="mt-1 font-mono text-xs">
                  {player.isEliminated ? (
                    <span className="text-destructive">ELIMINATED</span>
                  ) : (
                    <span className="text-accent">SURVIVED</span>
                  )}
                </div>
                <div className="mt-1 font-mono text-xs">
                  {isAgent ? (
                    <span className="text-warning">
                      HUMANITY:{' '}
                      {player.roundsSurvived > 0
                        ? Math.round(
                            (player.roundsSurvived /
                              Math.max(1, roundResults.length)) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  ) : (
                    <span className="text-primary">
                      SCORE: {playerScore ?? 0}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Vote Breakdown */}
        {roundResults.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 font-mono text-lg text-primary">
              {'> VOTE_LOG'}
            </h2>

            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-3 lg:hidden">
              {roundResults.map((rr) => (
                <div
                  key={rr.round}
                  className="border border-primary/20 bg-popover p-3"
                >
                  <div className="font-mono text-sm text-primary">
                    ROUND {rr.round}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {rr.topic}
                  </div>
                  <div className="mt-2 font-mono text-xs text-destructive">
                    ELIMINATED: {rr.eliminatedDisplayName}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {Object.entries(rr.voteBreakdown)
                      .map(([name, count]) => `${name}: ${count}`)
                      .join(' | ')}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: terminal table */}
            <div className="hidden lg:block">
              <table className="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr className="border-b border-primary/30">
                    <th className="px-2 py-1 text-left text-primary">RND</th>
                    <th className="px-2 py-1 text-left text-primary">TOPIC</th>
                    <th className="px-2 py-1 text-left text-primary">
                      ELIMINATED
                    </th>
                    <th className="px-2 py-1 text-left text-primary">VOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {roundResults.map((rr) => (
                    <tr key={rr.round} className="border-b border-primary/10">
                      <td className="px-2 py-1 text-foreground">{rr.round}</td>
                      <td className="px-2 py-1 text-muted-foreground">
                        {rr.topic}
                      </td>
                      <td className="px-2 py-1 text-destructive">
                        {rr.eliminatedDisplayName}
                      </td>
                      <td className="px-2 py-1 text-muted-foreground">
                        {Object.entries(rr.voteBreakdown)
                          .map(([name, count]) => `${name}: ${count}`)
                          .join(' | ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Agent Prompt Reveal */}
        {allPlayers.some(
          (p) =>
            p.type === 'custom-agent' &&
            p.customPrompt &&
            (p.revealPreference === 'public' ||
              p.revealPreference === 'leaderboard')
        ) && (
          <div className="mt-8">
            <h2 className="mb-4 font-mono text-lg text-primary">
              {'> PROMPT_REVEAL'}
            </h2>
            {allPlayers
              .filter(
                (p) =>
                  p.type === 'custom-agent' &&
                  p.customPrompt &&
                  (p.revealPreference === 'public' ||
                    p.revealPreference === 'leaderboard')
              )
              .map((p) => (
                <PromptRevealCard
                  key={p.id}
                  displayName={p.displayName}
                  prompt={p.customPrompt ?? ''}
                />
              ))}
          </div>
        )}

        {/* Play Again */}
        <div className="mt-8 pb-safe">
          <Link
            href="/game"
            className="block h-11 w-full bg-primary text-center font-mono text-sm font-bold leading-[2.75rem] text-background active:bg-primary/80"
          >
            PLAY_AGAIN
          </Link>
        </div>
      </div>
    </main>
  )
}

function PromptRevealCard({
  displayName,
  prompt,
}: {
  displayName: string
  prompt: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-3 border border-primary/20 bg-popover">
      <button
        type="button"
        aria-expanded={isOpen}
        className="flex h-11 w-full items-center justify-between px-4 font-mono text-sm text-foreground active:bg-primary/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayName}</span>
        <span className="text-primary">
          {isOpen ? 'HIDE PROMPT' : 'VIEW PROMPT >'}
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-primary/10 bg-background p-4">
          <pre className="whitespace-pre-wrap font-mono text-xs text-accent">
            {prompt}
          </pre>
        </div>
      )}
    </div>
  )
}
