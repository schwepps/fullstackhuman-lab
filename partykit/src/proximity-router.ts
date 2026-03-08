import type { Position, ZoneType } from '../../lib/game/types'
import { ZONES } from '../../lib/game/zones'

/**
 * Determine which zone a position falls within.
 * Checks private zones first (smaller, higher priority), falls back to 'main'.
 */
export function computeZone(position: Position): ZoneType {
  for (const zone of ZONES) {
    if (!zone.isPrivate) continue
    const { x, y, width, height } = zone.bounds
    if (
      position.x >= x &&
      position.x <= x + width &&
      position.y >= y &&
      position.y <= y + height
    ) {
      return zone.id
    }
  }
  return 'main'
}

/**
 * Get all player IDs currently in a given zone.
 */
export function getPlayersInZone(
  zone: ZoneType,
  zonesMap: Map<string, ZoneType>
): string[] {
  const result: string[] = []
  for (const [playerId, playerZone] of zonesMap) {
    if (playerZone === zone) result.push(playerId)
  }
  return result
}
