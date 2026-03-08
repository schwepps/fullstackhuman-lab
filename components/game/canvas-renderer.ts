import { Graphics, Container, TextStyle, Text } from 'pixi.js'
import type { Position } from '@/lib/game/types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  AVATAR_RADIUS,
} from '@/lib/game/constants'

// ─── Color palette from art direction ──────────────────────────────────────
export const DEEP_BLACK = 0x0a0a0c
export const SURFACE_DARK = 0x111118
export const MUTED_BORDER = 0x1e293b
export const ELECTRIC_CYAN = 0x22d3ee
export const MATRIX_GREEN = 0x4ade80

// ─── Types ────────────────────────────────────────────────────────────────
export type AvatarData = {
  container: Container
  body: Graphics
  glow: Graphics
  nameTag: Container
  color: number
  isOwn: boolean
}

export type Particle = {
  gfx: Graphics
  vx: number
  vy: number
}

export type GhostTrail = {
  positions: Position[]
  frameCounter: number
  stationaryFrames: number
}

export type MoveToTarget = {
  target: Position
  indicator: Graphics
}

export type ZoneEntryParticle = {
  gfx: Graphics
  vx: number
  vy: number
  life: number
  startTime: number
}

// ─── Entity creation ─────────────────────────────────────────────────────

export function createParticles(stage: Container): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < 4; i++) {
    const gfx = new Graphics()
    const color = Math.random() > 0.5 ? ELECTRIC_CYAN : MATRIX_GREEN
    gfx
      .circle(0, 0, 1 + Math.random())
      .fill({ color, alpha: 0.1 + Math.random() * 0.1 })
    gfx.x = Math.random() * CANVAS_WIDTH
    gfx.y = Math.random() * CANVAS_HEIGHT
    stage.addChild(gfx)
    particles.push({
      gfx,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    })
  }
  return particles
}

export function spawnZoneEntryParticles(
  stage: Container,
  x: number,
  y: number,
  color: number
): ZoneEntryParticle[] {
  const particles: ZoneEntryParticle[] = []
  for (let i = 0; i < 6; i++) {
    const gfx = new Graphics()
    gfx.circle(0, 0, 1.5).fill({ color, alpha: 0.6 })
    gfx.x = x
    gfx.y = y
    stage.addChild(gfx)

    const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5
    const speed = 1 + Math.random() * 2
    particles.push({
      gfx,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 500,
      startTime: Date.now(),
    })
  }
  return particles
}

export function createAvatar(
  playerId: string,
  color: number,
  displayName: string,
  position: Position,
  isOwn: boolean,
  avatars: Map<string, AvatarData>
): Container {
  const container = new Container()
  container.x = position.x
  container.y = position.y

  // Glow ring
  const glow = new Graphics()
  glow.circle(0, 0, AVATAR_RADIUS + 4).fill({ color, alpha: 0.25 })
  container.addChild(glow)

  // Body
  const body = new Graphics()
  body.circle(0, 0, AVATAR_RADIUS).fill({ color, alpha: 0.9 })
  container.addChild(body)

  // Initials
  const initials = displayName.slice(0, 2).toUpperCase()
  const initialsText = new Text({
    text: initials,
    style: new TextStyle({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0xffffff,
    }),
  })
  initialsText.anchor.set(0.5)
  container.addChild(initialsText)

  // Name tag
  const nameTag = new Container()
  const truncName =
    displayName.length > 8 ? displayName.slice(0, 7) + '\u2026' : displayName
  const nameText = new Text({
    text: truncName,
    style: new TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0xffffff,
    }),
  })
  nameText.anchor.set(0.5)

  const pillBg = new Graphics()
  const pillW = nameText.width + 10
  const pillH = nameText.height + 4
  pillBg
    .roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 4)
    .fill({ color: DEEP_BLACK, alpha: 0.8 })
  nameTag.addChild(pillBg)
  nameTag.addChild(nameText)
  nameTag.y = 30

  container.addChild(nameTag)

  avatars.set(playerId, { container, body, glow, nameTag, color, isOwn })

  return container
}
