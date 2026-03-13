import { Graphics, Text, Container, TextStyle } from 'pixi.js'
import { ZONES } from '@/lib/game/zones'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/game/constants'
import {
  SURFACE_DARK,
  MUTED_BORDER,
  ELECTRIC_CYAN,
  MATRIX_GREEN,
} from './canvas-renderer'

// ─── Static room drawing ───────────────────────────────────────────────────

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

// ─── Zone background fills + labels ────────────────────────────────────────

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
