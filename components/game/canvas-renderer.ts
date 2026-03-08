import { Graphics, Text, Container, TextStyle } from 'pixi.js'
import type { Position } from '@/lib/game/types'
import { ZONES } from '@/lib/game/zones'
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

// ─── Drawing functions ────────────────────────────────────────────────────

export function drawRoom(stage: Container) {
  const room = new Graphics()

  // Floor base
  room.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).fill(SURFACE_DARK)

  // Circuit-board grid
  room.setStrokeStyle({ width: 1, color: MUTED_BORDER, alpha: 0.15 })
  for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
    room.moveTo(x, 0).lineTo(x, CANVAS_HEIGHT).stroke()
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
    room.moveTo(0, y).lineTo(CANVAS_WIDTH, y).stroke()
  }

  // Outer boundary
  room
    .setStrokeStyle({ width: 1, color: ELECTRIC_CYAN, alpha: 0.3 })
    .rect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20)
    .stroke()

  // Corner brackets (viewfinder style)
  const bracketLen = 20
  const corners = [
    { x: 10, y: 10, dx: 1, dy: 1 },
    { x: CANVAS_WIDTH - 10, y: 10, dx: -1, dy: 1 },
    { x: 10, y: CANVAS_HEIGHT - 10, dx: 1, dy: -1 },
    { x: CANVAS_WIDTH - 10, y: CANVAS_HEIGHT - 10, dx: -1, dy: -1 },
  ]
  room.setStrokeStyle({ width: 2, color: ELECTRIC_CYAN, alpha: 0.4 })
  for (const c of corners) {
    room
      .moveTo(c.x, c.y + c.dy * bracketLen)
      .lineTo(c.x, c.y)
      .lineTo(c.x + c.dx * bracketLen, c.y)
      .stroke()
  }

  // Holographic tables in main room
  const tableStyle = { width: 1, color: ELECTRIC_CYAN, alpha: 0.12 }
  room.setStrokeStyle(tableStyle).roundRect(450, 300, 60, 40, 4).stroke()
  room.setStrokeStyle(tableStyle).roundRect(600, 420, 70, 35, 4).stroke()
  room.setStrokeStyle(tableStyle).roundRect(350, 480, 55, 45, 4).stroke()

  // Bar counter (L-shape)
  room.setStrokeStyle({ width: 1, color: ELECTRIC_CYAN, alpha: 0.15 })
  room.moveTo(850, 200).lineTo(850, 380).lineTo(920, 380).stroke()

  // Floor terminal glows
  const terminalGlow = { color: ELECTRIC_CYAN, alpha: 0.08 }
  room.rect(300, 250, 8, 6).fill(terminalGlow)
  room.rect(700, 500, 8, 6).fill(terminalGlow)
  room.rect(500, 180, 8, 6).fill(terminalGlow)

  // Floor watermark
  const watermark = new Text({
    text: '> MAIN_ROOM',
    style: new TextStyle({
      fontFamily: 'monospace',
      fontSize: 36,
      fill: MATRIX_GREEN,
    }),
  })
  watermark.alpha = 0.05
  watermark.x = 400
  watermark.y = 380

  stage.addChild(room)
  stage.addChild(watermark)
}

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

export function drawZoneBackgrounds(stage: Container): Graphics {
  const privateZones = ZONES.filter((z) => z.isPrivate)

  for (const zone of privateZones) {
    const { x, y, width, height } = zone.bounds
    const bg = new Graphics()

    // Zone-specific floor fill colors
    const fills: Record<string, number> = {
      'private-a': 0x1a1822, // warm purple (Corner Booth)
      'private-b': 0x161a22, // cool blue (Back Room)
      'private-c': 0x161a18, // green (Side Hall)
    }
    bg.rect(x, y, width, height).fill({
      color: fills[zone.id] ?? 0x161616,
      alpha: 0.6,
    })

    // Zone-specific interior decoration
    if (zone.id === 'private-a') {
      bg.rect(x + 10, y + 30, 30, 12).fill({ color: MUTED_BORDER, alpha: 0.2 })
      bg.rect(x + 10, y + 78, 30, 12).fill({ color: MUTED_BORDER, alpha: 0.2 })
    } else if (zone.id === 'private-b') {
      const rackW = 6
      const rackH = 40
      const rackY = y + 40
      for (let i = 0; i < 4; i++) {
        const rackX = x + 20 + i * 35
        bg.rect(rackX, rackY, rackW, rackH).fill({
          color: MUTED_BORDER,
          alpha: 0.25,
        })
      }
    } else if (zone.id === 'private-c') {
      bg.setStrokeStyle({ width: 1, color: MUTED_BORDER, alpha: 0.1 })
      for (let i = 0; i < 4; i++) {
        const lineY = y + 25 + i * 25
        bg.moveTo(x + 10, lineY)
          .lineTo(x + width - 10, lineY)
          .stroke()
      }
    }

    // Zone label
    const labelText =
      zone.id === 'private-a'
        ? '> Corner_Booth'
        : zone.id === 'private-b'
          ? '> Back_Room'
          : '> Side_Hall'
    const label = new Text({
      text: labelText,
      style: new TextStyle({
        fontFamily: 'monospace',
        fontSize: 10,
        fill: MATRIX_GREEN,
      }),
    })
    label.alpha = 0.5
    label.x = x + 6
    label.y = y + 6

    stage.addChild(bg)
    stage.addChild(label)
  }

  // Animated zone boundaries — drawn each frame in the ticker
  const zoneGfx = new Graphics()
  stage.addChild(zoneGfx)
  return zoneGfx
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
