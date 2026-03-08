import type { MutableRefObject } from 'react'
import { Graphics } from 'pixi.js'
import type { Application, Ticker } from 'pixi.js'
import type { Position } from '@/lib/game/types'
import { ZONES } from '@/lib/game/zones'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  AVATAR_RADIUS,
  MOVE_SPEED,
  POSITION_BROADCAST_INTERVAL_MS,
} from '@/lib/game/constants'
import { ELECTRIC_CYAN, MATRIX_GREEN } from './canvas-renderer'
import type {
  AvatarData,
  Particle,
  GhostTrail,
  MoveToTarget,
  ZoneEntryParticle,
} from './canvas-renderer'

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
    for (const p of refs.particles.current) {
      p.gfx.x += p.vx
      p.gfx.y += p.vy
      if (p.gfx.x < 0) p.gfx.x = CANVAS_WIDTH
      if (p.gfx.x > CANVAS_WIDTH) p.gfx.x = 0
      if (p.gfx.y < 0) p.gfx.y = CANVAS_HEIGHT
      if (p.gfx.y > CANVAS_HEIGHT) p.gfx.y = 0
    }

    // Animate zone boundaries (dashed border with flowing effect)
    refs.zoneDashOffset.current += 0.5
    refs.ledPhase.current += ticker.deltaTime * 0.05
    const zoneGfx = refs.zoneGfx.current
    if (zoneGfx) {
      zoneGfx.clear()
      const offset = refs.zoneDashOffset.current
      const privateZones = ZONES.filter((z) => z.isPrivate)

      for (const zone of privateZones) {
        const { x, y, width, height } = zone.bounds
        const dashLen = 8
        const gapLen = 6
        const doorwayGap = 30
        const totalLen = dashLen + gapLen

        zoneGfx.setStrokeStyle({ width: 1, color: ELECTRIC_CYAN, alpha: 0.4 })

        // Top
        drawDashedLine(
          zoneGfx,
          x,
          y,
          x + width,
          y,
          Infinity,
          -Infinity,
          dashLen,
          totalLen,
          offset
        )
        // Right
        drawDashedLine(
          zoneGfx,
          x + width,
          y,
          x + width,
          y + height,
          Infinity,
          -Infinity,
          dashLen,
          totalLen,
          offset
        )
        // Bottom (with doorway gap in center)
        const bottomCenter = width / 2
        drawDashedLine(
          zoneGfx,
          x,
          y + height,
          x + width,
          y + height,
          bottomCenter - doorwayGap / 2,
          bottomCenter + doorwayGap / 2,
          dashLen,
          totalLen,
          offset
        )
        // Left
        drawDashedLine(
          zoneGfx,
          x,
          y + height,
          x,
          y,
          Infinity,
          -Infinity,
          dashLen,
          totalLen,
          offset
        )

        // Back Room blinking LEDs
        if (zone.id === 'private-b') {
          const phase = refs.ledPhase.current
          for (let i = 0; i < 4; i++) {
            const rackX = x + 20 + i * 35 + 3
            for (let j = 0; j < 3; j++) {
              const ledY = y + 45 + j * 12
              const ledPhase = phase + i * 1.3 + j * 0.7
              const ledAlpha = 0.1 + 0.5 * (0.5 + 0.5 * Math.sin(ledPhase))
              zoneGfx
                .circle(rackX, ledY, 1.5)
                .fill({ color: MATRIX_GREEN, alpha: ledAlpha })
            }
          }
        }
      }
    }

    // Update zone entry particles
    const now2 = Date.now()
    refs.zoneEntryParticles.current = refs.zoneEntryParticles.current.filter(
      (ep) => {
        const elapsed = now2 - ep.startTime
        if (elapsed >= ep.life) {
          ep.gfx.destroy()
          return false
        }
        ep.gfx.x += ep.vx
        ep.gfx.y += ep.vy
        ep.gfx.alpha = 0.6 * (1 - elapsed / ep.life)
        return true
      }
    )
  }
}

function drawDashedLine(
  gfx: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  skipStart: number,
  skipEnd: number,
  dashLen: number,
  totalLen: number,
  offset: number
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  const nx = dx / len
  const ny = dy / len
  let d = ((offset % totalLen) + totalLen) % totalLen

  while (d < len) {
    if (d >= skipStart && d <= skipEnd) {
      d += dashLen
      continue
    }
    const segEnd = Math.min(d + dashLen, len)
    if (segEnd > skipStart && d < skipEnd) {
      d += dashLen
      continue
    }
    gfx
      .moveTo(x1 + nx * d, y1 + ny * d)
      .lineTo(x1 + nx * segEnd, y1 + ny * segEnd)
      .stroke()
    d += totalLen
  }
}
