import type { MutableRefObject } from 'react'
import { Graphics } from 'pixi.js'
import type { Application, Ticker } from 'pixi.js'
import type { Position } from '@/lib/game/types'
import {
  AVATAR_RADIUS,
  MOVE_SPEED,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  POSITION_BROADCAST_INTERVAL_MS,
} from '@/lib/game/constants'
import type {
  AvatarData,
  Particle,
  GhostTrail,
  MoveToTarget,
  ZoneEntryParticle,
} from './canvas-renderer'
import {
  updateZoneBoundaries,
  updateAmbientParticles,
  filterZoneEntryParticles,
} from './canvas-zone-effects'

export type TickerRefs = {
  app: Application
  myPlayerId: string
  avatars: Map<string, AvatarData>
  myPosition: MutableRefObject<Position>
  keys: MutableRefObject<Set<string>>
  moveToTarget: MutableRefObject<MoveToTarget | null>
  trail: MutableRefObject<GhostTrail>
  trailGfx: MutableRefObject<Graphics | null>
  ripple: MutableRefObject<{
    gfx: Graphics
    startTime: number
    x: number
    y: number
  } | null>
  particles: MutableRefObject<Particle[]>
  zoneEntryParticles: MutableRefObject<ZoneEntryParticle[]>
  zoneDashOffset: MutableRefObject<number>
  ledPhase: MutableRefObject<number>
  zoneGfx: MutableRefObject<Graphics | null>
  lastBroadcast: MutableRefObject<number>
  isChatFocused: MutableRefObject<boolean>
  socket: MutableRefObject<WebSocket | null>
  onPositionUpdate?: (position: Position) => void
}

export function createGameTicker(refs: TickerRefs): (ticker: Ticker) => void {
  let glowPhase = 0

  return (ticker: Ticker) => {
    const avatar = refs.avatars.get(refs.myPlayerId)
    if (!avatar) return

    const pos = refs.myPosition.current
    let moved = false

    // Keyboard movement
    if (!refs.isChatFocused.current) {
      const keys = refs.keys.current
      if (keys.has('w') || keys.has('ArrowUp')) {
        pos.y = Math.max(AVATAR_RADIUS, pos.y - MOVE_SPEED)
        moved = true
      }
      if (keys.has('s') || keys.has('ArrowDown')) {
        pos.y = Math.min(CANVAS_HEIGHT - AVATAR_RADIUS, pos.y + MOVE_SPEED)
        moved = true
      }
      if (keys.has('a') || keys.has('ArrowLeft')) {
        pos.x = Math.max(AVATAR_RADIUS, pos.x - MOVE_SPEED)
        moved = true
      }
      if (keys.has('d') || keys.has('ArrowRight')) {
        pos.x = Math.min(CANVAS_WIDTH - AVATAR_RADIUS, pos.x + MOVE_SPEED)
        moved = true
      }
    }

    // Move-to interpolation
    const moveTo = refs.moveToTarget.current
    if (moveTo && !moved) {
      const dx = moveTo.target.x - pos.x
      const dy = moveTo.target.y - pos.y
      const dist = Math.hypot(dx, dy)
      if (dist < MOVE_SPEED) {
        pos.x = moveTo.target.x
        pos.y = moveTo.target.y
        moveTo.indicator.destroy()
        refs.moveToTarget.current = null
        // Trigger arrival ripple
        const rippleGfx = new Graphics()
        refs.app.stage.addChild(rippleGfx)
        refs.ripple.current = {
          gfx: rippleGfx,
          startTime: Date.now(),
          x: pos.x,
          y: pos.y,
        }
        moved = true
      } else {
        pos.x += (dx / dist) * MOVE_SPEED
        pos.y += (dy / dist) * MOVE_SPEED
        moved = true
        // Pulse indicator alpha
        const pulse = 0.3 + 0.4 * Math.abs(Math.sin(Date.now() * 0.003))
        moveTo.indicator.alpha = pulse
      }
    }

    // Update own avatar position
    avatar.container.x = pos.x
    avatar.container.y = pos.y

    // Own avatar glow pulse
    glowPhase += ticker.deltaTime * 0.03
    avatar.glow.alpha = 0.15 + 0.2 * Math.abs(Math.sin(glowPhase))

    // Walk trail
    const trail = refs.trail.current
    trail.frameCounter++
    if (moved) {
      trail.stationaryFrames = 0
      if (trail.frameCounter % 4 === 0) {
        trail.positions.push({ x: pos.x, y: pos.y })
        if (trail.positions.length > 3) trail.positions.shift()
      }
    } else {
      trail.stationaryFrames++
      if (trail.stationaryFrames > 12) {
        trail.positions = []
      }
    }

    // Draw trail ghosts
    const trailGfx = refs.trailGfx.current
    if (trailGfx) {
      trailGfx.clear()
      const alphas = [0.12, 0.06, 0.02]
      trail.positions.forEach((tp, i) => {
        trailGfx
          .circle(tp.x, tp.y, AVATAR_RADIUS)
          .fill({ color: avatar.color, alpha: alphas[i] ?? 0.02 })
      })
    }

    // Arrival ripple animation
    const ripple = refs.ripple.current
    if (ripple) {
      const elapsed = Date.now() - ripple.startTime
      const progress = elapsed / 500
      if (progress >= 1) {
        ripple.gfx.destroy()
        refs.ripple.current = null
      } else {
        const radius = AVATAR_RADIUS + AVATAR_RADIUS * 2 * progress
        const alpha = 0.4 * (1 - progress)
        ripple.gfx.clear()
        ripple.gfx
          .setStrokeStyle({ width: 1, color: avatar.color, alpha })
          .circle(ripple.x, ripple.y, radius)
          .stroke()
      }
    }

    // Broadcast position at 15fps
    if (moved) {
      const now = Date.now()
      if (now - refs.lastBroadcast.current >= POSITION_BROADCAST_INTERVAL_MS) {
        refs.lastBroadcast.current = now
        const sock = refs.socket.current
        if (sock?.readyState === WebSocket.OPEN) {
          sock.send(
            JSON.stringify({ type: 'move', position: { x: pos.x, y: pos.y } })
          )
        }
        refs.onPositionUpdate?.({ x: pos.x, y: pos.y })
      }
    }

    // Update ambient particles
    updateAmbientParticles(refs.particles.current)

    // Animate zone boundaries + LEDs
    updateZoneBoundaries(
      refs.zoneGfx.current,
      refs.zoneDashOffset,
      refs.ledPhase,
      ticker.deltaTime
    )

    // Update zone entry particles
    refs.zoneEntryParticles.current = filterZoneEntryParticles(
      refs.zoneEntryParticles.current
    )
  }
}
