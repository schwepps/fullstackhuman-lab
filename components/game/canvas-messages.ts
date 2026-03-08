import type { MutableRefObject } from 'react'
import type { Application } from 'pixi.js'
import type { Position, PositionUpdate, ZoneType } from '@/lib/game/types'
import {
  ELECTRIC_CYAN,
  MATRIX_GREEN,
  createAvatar,
  spawnZoneEntryParticles,
} from './canvas-renderer'
import type { AvatarData, ZoneEntryParticle } from './canvas-renderer'

export type MessageHandlerRefs = {
  app: Application
  myPlayerId: string | null
  avatars: Map<string, AvatarData>
  myPosition: MutableRefObject<Position>
  myZone: MutableRefObject<ZoneType>
  zoneEntryParticles: MutableRefObject<ZoneEntryParticle[]>
  onZoneChange?: (zone: ZoneType) => void
}

export function handleServerMessage(
  data: string,
  refs: MessageHandlerRefs
): void {
  let msg
  try {
    msg = JSON.parse(data)
  } catch {
    return
  }

  switch (msg.type) {
    case 'player_joined': {
      const p = msg.player
      if (p.id === refs.myPlayerId || refs.avatars.has(p.id)) return
      refs.app.stage.addChild(
        createAvatar(
          p.id,
          p.avatarColor ?? ELECTRIC_CYAN,
          p.displayName ?? p.id.slice(0, 6),
          p.position ?? { x: 600, y: 400 },
          false,
          refs.avatars
        )
      )
      break
    }
    case 'position_update':
      for (const upd of msg.updates as PositionUpdate[]) {
        if (upd.playerId === refs.myPlayerId) continue
        const avatar = refs.avatars.get(upd.playerId)
        if (avatar) {
          avatar.container.x += (upd.position.x - avatar.container.x) * 0.3
          avatar.container.y += (upd.position.y - avatar.container.y) * 0.3
        }
      }
      break
    case 'zone_update':
      if (
        msg.playerId === refs.myPlayerId &&
        msg.zone !== refs.myZone.current
      ) {
        const prevZone = refs.myZone.current
        refs.myZone.current = msg.zone
        refs.onZoneChange?.(msg.zone)
        if (msg.zone !== 'main' && prevZone !== msg.zone) {
          const pos = refs.myPosition.current
          const zoneColors: Record<string, number> = {
            'private-a': 0xa78bfa,
            'private-b': 0x38bdf8,
            'private-c': MATRIX_GREEN,
          }
          refs.zoneEntryParticles.current.push(
            ...spawnZoneEntryParticles(
              refs.app.stage,
              pos.x,
              pos.y,
              zoneColors[msg.zone] ?? ELECTRIC_CYAN
            )
          )
        }
      }
      break
    case 'player_left': {
      const avatar = refs.avatars.get(msg.playerId)
      if (avatar) {
        avatar.container.destroy()
        refs.avatars.delete(msg.playerId)
      }
      break
    }
  }
}
