import type { MutableRefObject } from 'react'
import { Graphics } from 'pixi.js'
import { ZONES } from '@/lib/game/zones'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/game/constants'
import { ELECTRIC_CYAN, MATRIX_GREEN } from './canvas-renderer'
import type { Particle, ZoneEntryParticle } from './canvas-renderer'

// ─── Zone boundary animation (called each frame) ──────────────────────────

export function updateZoneBoundaries(
  zoneGfx: Graphics | null,
  zoneDashOffset: MutableRefObject<number>,
  ledPhase: MutableRefObject<number>,
  deltaTime: number
): void {
  zoneDashOffset.current += 0.5
  ledPhase.current += deltaTime * 0.05

  if (!zoneGfx) return
  zoneGfx.clear()

  const offset = zoneDashOffset.current
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
      const phase = ledPhase.current
      for (let i = 0; i < 4; i++) {
        const rackX = x + 20 + i * 35 + 3
        for (let j = 0; j < 3; j++) {
          const ledY = y + 45 + j * 12
          const lp = phase + i * 1.3 + j * 0.7
          const ledAlpha = 0.1 + 0.5 * (0.5 + 0.5 * Math.sin(lp))
          zoneGfx
            .circle(rackX, ledY, 1.5)
            .fill({ color: MATRIX_GREEN, alpha: ledAlpha })
        }
      }
    }
  }
}

// ─── Ambient particle drift ────────────────────────────────────────────────

export function updateAmbientParticles(particles: Particle[]): void {
  for (const p of particles) {
    p.gfx.x += p.vx
    p.gfx.y += p.vy
    if (p.gfx.x < 0) p.gfx.x = CANVAS_WIDTH
    if (p.gfx.x > CANVAS_WIDTH) p.gfx.x = 0
    if (p.gfx.y < 0) p.gfx.y = CANVAS_HEIGHT
    if (p.gfx.y > CANVAS_HEIGHT) p.gfx.y = 0
  }
}

// ─── Zone entry particle lifecycle ─────────────────────────────────────────

export function filterZoneEntryParticles(
  particles: ZoneEntryParticle[]
): ZoneEntryParticle[] {
  const now = Date.now()
  return particles.filter((ep) => {
    const elapsed = now - ep.startTime
    if (elapsed >= ep.life) {
      ep.gfx.destroy()
      return false
    }
    ep.gfx.x += ep.vx
    ep.gfx.y += ep.vy
    ep.gfx.alpha = 0.6 * (1 - elapsed / ep.life)
    return true
  })
}

// ─── Dashed line helper ────────────────────────────────────────────────────

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
