'use client'

import type { Player } from '@/lib/types'

interface PlayerListProps {
  players: Player[]
  accusedIndex: number | null
}

export function PlayerList({ players, accusedIndex }: PlayerListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {players.map((player, i) => (
        <div
          key={player.sessionId}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            i === accusedIndex
              ? 'bg-danger text-white'
              : 'bg-surface text-muted-foreground'
          }`}
        >
          <span className="font-bold">{player.name[0].toUpperCase()}</span>
          <span>{player.name}</span>
          {i === accusedIndex && <span>ACCUSED</span>}
        </div>
      ))}
    </div>
  )
}
