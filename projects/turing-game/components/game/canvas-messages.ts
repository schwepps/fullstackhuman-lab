import type { MutableRefObject } from 'react'
import type { Application } from 'pixi.js'
import type { Position, PositionUpdate, ZoneType } from '@/lib/game/types'
import {
  DEFAULT_SPAWN_POSITION,
  FALLBACK_NAME_LENGTH,
} from '@/lib/game/constants'
import {
  ELECTRIC_CYAN,
  MATRIX_GREEN,
  createAvatar,
  updateAvatarName,
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
          p.displayName ?? p.id.slice(0, FALLBACK_NAME_LENGTH),
          p.position ?? { ...DEFAULT_SPAWN_POSITION },
          false,
          refs.avatars
        )
      )
      break
    }
    case 'position_update':
      for (const upd of msg.updates as PositionUpdate[]) {
        if (upd.playerId === refs.myPlayerId) continue
        let avatar = refs.avatars.get(upd.playerId)
        if (!avatar) {
          // Auto-create avatar for players we haven't seen yet (e.g. agents)
          const container = createAvatar(
            upd.playerId,
            ELECTRIC_CYAN,
            upd.playerId.slice(0, FALLBACK_NAME_LENGTH),
            upd.position,
            false,
            refs.avatars
          )
          refs.app.stage.addChild(container)
          avatar = refs.avatars.get(upd.playerId)
        }
        if (avatar) {
          // Store target — canvas ticker will smoothly interpolate each frame
          avatar.targetPosition = { x: upd.position.x, y: upd.position.y }
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
    case 'player_name_update': {
      const avatar = refs.avatars.get(msg.playerId)
      if (avatar && typeof msg.displayName === 'string') {
        updateAvatarName(avatar, msg.displayName)
      }
      break
    }
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
