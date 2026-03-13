import type * as Party from 'partykit/server'
import type { Position, ZoneType } from '../../lib/game/types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ZONE_DEBOUNCE_MS,
} from '../../lib/game/constants'
import { computeZone, getPlayersInZone } from './proximity-router'
import { ZONES } from '../../lib/game/zones'
import type { GameState } from './game-state'

/**
 * Apply a move for any player (human or agent).
 * Clamps position, detects zone, checks capacity, broadcasts updates.
 * Returns the new zone (or null if move was invalid).
 */
export function applyMove(
  playerId: string,
  position: Position,
  state: GameState,
  partyRoom: Party.Room,
  options?: { skipBroadcastToSender?: boolean }
): ZoneType | null {
  if (
    typeof position?.x !== 'number' ||
    typeof position?.y !== 'number' ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y)
  )
    return null

  const clamped: Position = {
    x: Math.max(0, Math.min(CANVAS_WIDTH, position.x)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT, position.y)),
  }
  state.positions.set(playerId, clamped)

  let newZone = computeZone(clamped)
  const prevZone = state.zones.get(playerId) ?? 'main'

  if (newZone !== prevZone && newZone !== 'main') {
    const zoneDef = ZONES.find((z) => z.id === newZone)
    if (zoneDef) {
      const occupants = getPlayersInZone(newZone, state.zones)
      if (occupants.length >= zoneDef.capacity) {
        newZone = prevZone
      }
    }
  }
  state.zones.set(playerId, newZone)

  if (newZone !== prevZone) {
    partyRoom.broadcast(
      JSON.stringify({ type: 'zone_update', playerId, zone: newZone })
    )

    const existingTimer = state.zoneWriteDebounce.get(playerId)
    if (existingTimer) clearTimeout(existingTimer)

    state.zoneWriteDebounce.set(
      playerId,
      setTimeout(async () => {
        state.zoneWriteDebounce.delete(playerId)
        try {
          const { roomStore } = await import('../../lib/game/room-store')
          await roomStore.update(partyRoom.id, (r) => {
            const player = r.players.get(playerId)
            if (player) player.currentZone = newZone
            return r
          })
        } catch {
          // Room may not exist yet
        }
      }, ZONE_DEBOUNCE_MS)
    )
  }

  // Broadcast position — exclude sender for human moves (they have local prediction)
  const exclude = options?.skipBroadcastToSender ? [playerId] : []
  partyRoom.broadcast(
    JSON.stringify({
      type: 'position_update',
      updates: [{ playerId, position: clamped, zone: newZone }],
    }),
    exclude
  )

  return newZone
}
