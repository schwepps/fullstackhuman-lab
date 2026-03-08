'use client'

import { useState } from 'react'
import Link from 'next/link'
import type {
  GameResult,
  RevealPlayer,
  RoundResult,
  PlayerType,
} from '@/lib/game/types'

interface RevealScreenProps {
  result: GameResult
  allPlayers: RevealPlayer[]
  roundResults: RoundResult[]
}

function getHeadline(result: GameResult, players: RevealPlayer[]) {
  if (result.wasAllHumans) {
    return {
      text: 'YOU WERE HUNTING GHOSTS. THIS ROOM WAS 100% HUMAN.',
      color: 'text-[#f59e0b]',
    }
  }
  if (result.agentsSurvived.length > 0) {
    const survivor = players.find((p) => p.id === result.agentsSurvived[0])
    const name = survivor?.displayName ?? 'UNKNOWN'
    const rounds = survivor?.roundsSurvived ?? 0
    return {
      text: `THE AI WON. ${name} SURVIVED ${rounds} ROUNDS UNDETECTED.`,
      color: 'text-red-500',
    }
  }
  return {
    text: 'HUMANS WIN. ALL AIs ELIMINATED.',
    color: 'text-[#4ade80]',
  }
}

function getRoleDisplay(type: PlayerType) {
  switch (type) {
    case 'auto-agent':
    case 'custom-agent':
      return { label: 'AGENT', color: 'text-red-500' }
    case 'spectator':
      return { label: 'SPECTATOR', color: 'text-[#f59e0b]' }
    default:
      return { label: 'HUMAN', color: 'text-[#4ade80]' }
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
    <main className="min-h-svh bg-[#0a0a0c] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="animate-glitch font-mono text-2xl text-[#22d3ee] sm:text-3xl">
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
            const isAgent =
              player.type === 'auto-agent' || player.type === 'custom-agent'
            const playerScore =
              scores instanceof Map
                ? scores.get(player.id)
                : (scores as Record<string, number>)?.[player.id]

            return (
              <div
                key={player.id}
                className="border border-[#22d3ee]/20 bg-[#111118] p-4"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: `#${player.avatarColor.toString(16).padStart(6, '0')}`,
                    }}
                  />
                  <span className="font-mono font-bold text-[#e2e8f0]">
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
                    <span className="text-red-500">ELIMINATED</span>
                  ) : (
                    <span className="text-[#4ade80]">SURVIVED</span>
                  )}
                </div>
                <div className="mt-1 font-mono text-xs">
                  {isAgent ? (
                    <span className="text-[#f59e0b]">
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
                    <span className="text-[#22d3ee]">
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
            <h2 className="mb-4 font-mono text-lg text-[#22d3ee]">
              {'> VOTE_LOG'}
            </h2>

            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-3 lg:hidden">
              {roundResults.map((rr) => (
                <div
                  key={rr.round}
                  className="border border-[#22d3ee]/20 bg-[#111118] p-3"
                >
                  <div className="font-mono text-sm text-[#22d3ee]">
                    ROUND {rr.round}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[#94a3b8]">
                    {rr.topic}
                  </div>
                  <div className="mt-2 font-mono text-xs text-red-500">
                    ELIMINATED: {rr.eliminatedDisplayName}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[#94a3b8]">
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
                  <tr className="border-b border-[#22d3ee]/30">
                    <th className="px-2 py-1 text-left text-[#22d3ee]">RND</th>
                    <th className="px-2 py-1 text-left text-[#22d3ee]">
                      TOPIC
                    </th>
                    <th className="px-2 py-1 text-left text-[#22d3ee]">
                      ELIMINATED
                    </th>
                    <th className="px-2 py-1 text-left text-[#22d3ee]">
                      VOTES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roundResults.map((rr) => (
                    <tr key={rr.round} className="border-b border-[#22d3ee]/10">
                      <td className="px-2 py-1 text-[#e2e8f0]">{rr.round}</td>
                      <td className="px-2 py-1 text-[#94a3b8]">{rr.topic}</td>
                      <td className="px-2 py-1 text-red-500">
                        {rr.eliminatedDisplayName}
                      </td>
                      <td className="px-2 py-1 text-[#94a3b8]">
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
            <h2 className="mb-4 font-mono text-lg text-[#22d3ee]">
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
            className="block h-11 w-full bg-[#22d3ee] text-center font-mono text-sm font-bold leading-[2.75rem] text-[#0a0a0c] active:bg-[#22d3ee]/80"
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
    <div className="mb-3 border border-[#22d3ee]/20 bg-[#111118]">
      <button
        className="flex h-11 w-full items-center justify-between px-4 font-mono text-sm text-[#e2e8f0] active:bg-[#22d3ee]/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayName}</span>
        <span className="text-[#22d3ee]">
          {isOpen ? 'HIDE PROMPT' : 'VIEW PROMPT >'}
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-[#22d3ee]/10 bg-[#0a0a0c] p-4">
          <pre className="whitespace-pre-wrap font-mono text-xs text-[#4ade80]">
            {prompt}
          </pre>
        </div>
      )}
    </div>
  )
}
