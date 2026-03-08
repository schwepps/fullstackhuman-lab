'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Application, Graphics, Text, Container, TextStyle } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import type { Position, PositionUpdate, ZoneType } from '@/lib/game/types'
import { ZONES } from '@/lib/game/zones'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  AVATAR_RADIUS,
  MOVE_SPEED,
  DOUBLE_TAP_THRESHOLD_MS,
  DOUBLE_TAP_DISTANCE_PX,
  POSITION_BROADCAST_INTERVAL_MS,
} from '@/lib/game/constants'

// ─── Color palette from art direction ──────────────────────────────────────
const DEEP_BLACK = 0x0a0a0c
const SURFACE_DARK = 0x111118
const MUTED_BORDER = 0x1e293b
const ELECTRIC_CYAN = 0x22d3ee
const MATRIX_GREEN = 0x4ade80

// ─── Types ────────────────────────────────────────────────────────────────
type AvatarData = {
  container: Container
  body: Graphics
  glow: Graphics
  nameTag: Container
  color: number
  isOwn: boolean
}

type Particle = {
  gfx: Graphics
  vx: number
  vy: number
}

type GhostTrail = {
  positions: Position[]
  frameCounter: number
  stationaryFrames: number
}

type MoveToTarget = {
  target: Position
  indicator: Graphics
}

type ZoneEntryParticle = {
  gfx: Graphics
  vx: number
  vy: number
  life: number
  startTime: number
}

type GameCanvasProps = {
  socket: WebSocket | null
  myPlayerId: string | null
  myColor: number
  isChatFocused: boolean
  onPositionUpdate?: (position: Position) => void
  onZoneChange?: (zone: ZoneType) => void
}

export function GameCanvas({
  socket,
  myPlayerId,
  myColor,
  isChatFocused,
  onPositionUpdate,
  onZoneChange,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const avatarsRef = useRef<Map<string, AvatarData>>(new Map())
  const myPositionRef = useRef<Position>({ x: 600, y: 400 })
  const keysRef = useRef<Set<string>>(new Set())
  const scaleRef = useRef(1)
  const lastBroadcastRef = useRef(0)
  const moveToRef = useRef<MoveToTarget | null>(null)
  const trailRef = useRef<GhostTrail>({
    positions: [],
    frameCounter: 0,
    stationaryFrames: 0,
  })
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const trailGfxRef = useRef<Graphics | null>(null)
  const tickerRef = useRef<((ticker: Ticker) => void) | null>(null)
  const rippleRef = useRef<{
    gfx: Graphics
    startTime: number
    x: number
    y: number
  } | null>(null)
  const myZoneRef = useRef<ZoneType>('main')
  const zoneEntryParticlesRef = useRef<ZoneEntryParticle[]>([])
  const zoneDashOffsetRef = useRef(0)
  const zoneGfxRef = useRef<Graphics | null>(null)
  const ledPhaseRef = useRef(0)

  // ─── Canvas scaling ──────────────────────────────────────────────────────
  const updateScale = useCallback(() => {
    if (!containerRef.current || !appRef.current) return
    const parent = containerRef.current
    const availW = parent.clientWidth
    const availH = parent.clientHeight
    const scale = Math.min(availW / CANVAS_WIDTH, availH / CANVAS_HEIGHT, 1)
    scaleRef.current = scale
    const canvas = appRef.current.canvas as HTMLCanvasElement
    canvas.style.transform = `scale(${scale})`
    canvas.style.transformOrigin = 'top left'
  }, [])

  // ─── Draw room environment ──────────────────────────────────────────────
  const drawRoom = useCallback((stage: Container) => {
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
  }, [])

  // ─── Create ambient particles ────────────────────────────────────────────
  const createParticles = useCallback((stage: Container) => {
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
    particlesRef.current = particles
  }, [])

  // ─── Draw zone overlays ─────────────────────────────────────────────────
  const drawZoneBackgrounds = useCallback((stage: Container) => {
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
        // Booth seats — two small rects facing each other
        bg.rect(x + 10, y + 30, 30, 12).fill({
          color: MUTED_BORDER,
          alpha: 0.2,
        })
        bg.rect(x + 10, y + 78, 30, 12).fill({
          color: MUTED_BORDER,
          alpha: 0.2,
        })
      } else if (zone.id === 'private-b') {
        // Server racks — thin vertical rects
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
        // Cable traces — horizontal lines
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
    zoneGfxRef.current = zoneGfx
  }, [])

  // ─── Spawn zone entry particles ────────────────────────────────────────
  const spawnZoneEntryParticles = useCallback(
    (stage: Container, x: number, y: number, color: number) => {
      for (let i = 0; i < 6; i++) {
        const gfx = new Graphics()
        gfx.circle(0, 0, 1.5).fill({ color, alpha: 0.6 })
        gfx.x = x
        gfx.y = y
        stage.addChild(gfx)

        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5
        const speed = 1 + Math.random() * 2
        zoneEntryParticlesRef.current.push({
          gfx,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 500,
          startTime: Date.now(),
        })
      }
    },
    []
  )

  // ─── Create avatar ──────────────────────────────────────────────────────
  const createAvatar = useCallback(
    (
      playerId: string,
      color: number,
      displayName: string,
      position: Position,
      isOwn: boolean
    ) => {
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
        displayName.length > 8
          ? displayName.slice(0, 7) + '\u2026'
          : displayName
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

      const avatarData: AvatarData = {
        container,
        body,
        glow,
        nameTag,
        color,
        isOwn,
      }
      avatarsRef.current.set(playerId, avatarData)

      return container
    },
    []
  )

  // ─── Initialize PixiJS ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false
    const app = new Application()

    const init = async () => {
      await app.init({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: DEEP_BLACK,
        antialias: true,
      })
      if (destroyed) return

      appRef.current = app
      const canvas = app.canvas as HTMLCanvasElement
      canvas.style.touchAction = 'manipulation'
      containerRef.current?.appendChild(canvas)

      // Draw environment
      drawRoom(app.stage)
      drawZoneBackgrounds(app.stage)
      createParticles(app.stage)

      // Trail graphics layer
      const trailGfx = new Graphics()
      app.stage.addChild(trailGfx)
      trailGfxRef.current = trailGfx

      // Create own avatar
      if (myPlayerId) {
        const ownAvatar = createAvatar(
          myPlayerId,
          myColor,
          'You',
          myPositionRef.current,
          true
        )
        app.stage.addChild(ownAvatar)
      }

      // ─── Keyboard input ─────────────────────────────────────────────
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          [
            'w',
            'a',
            's',
            'd',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
          ].includes(e.key)
        ) {
          keysRef.current.add(e.key)
          // Cancel move-to if keyboard is pressed
          if (moveToRef.current) {
            moveToRef.current.indicator.destroy()
            moveToRef.current = null
          }
        }
      }
      const handleKeyUp = (e: KeyboardEvent) => {
        keysRef.current.delete(e.key)
      }
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)

      // ─── Double-tap / double-click detection ─────────────────────────
      const handleTapStart = (clientX: number, clientY: number) => {
        if (!appRef.current) return
        const rect = canvas.getBoundingClientRect()
        const scale = scaleRef.current
        const gameX = (clientX - rect.left) / scale
        const gameY = (clientY - rect.top) / scale

        const now = Date.now()
        const last = lastTapRef.current
        if (
          last &&
          now - last.time < DOUBLE_TAP_THRESHOLD_MS &&
          Math.hypot(gameX - last.x, gameY - last.y) < DOUBLE_TAP_DISTANCE_PX
        ) {
          // Double tap detected — set move-to target
          const clampedX = Math.max(
            AVATAR_RADIUS,
            Math.min(CANVAS_WIDTH - AVATAR_RADIUS, gameX)
          )
          const clampedY = Math.max(
            AVATAR_RADIUS,
            Math.min(CANVAS_HEIGHT - AVATAR_RADIUS, gameY)
          )

          // Remove old indicator
          if (moveToRef.current) {
            moveToRef.current.indicator.destroy()
          }

          // Create crosshair indicator
          const indicator = new Graphics()
          indicator.setStrokeStyle({
            width: 1,
            color: MATRIX_GREEN,
            alpha: 0.5,
          })
          const sz = 8
          indicator
            .moveTo(clampedX - sz, clampedY)
            .lineTo(clampedX + sz, clampedY)
            .stroke()
          indicator
            .moveTo(clampedX, clampedY - sz)
            .lineTo(clampedX, clampedY + sz)
            .stroke()
          app.stage.addChild(indicator)

          moveToRef.current = {
            target: { x: clampedX, y: clampedY },
            indicator,
          }
          lastTapRef.current = null
        } else {
          lastTapRef.current = { time: now, x: gameX, y: gameY }
        }
      }

      canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0]
        if (touch) handleTapStart(touch.clientX, touch.clientY)
      })
      canvas.addEventListener('dblclick', (e) => {
        handleTapStart(e.clientX, e.clientY)
      })

      // ─── Window resize ──────────────────────────────────────────────
      updateScale()
      window.addEventListener('resize', updateScale)
      window.addEventListener('orientationchange', updateScale)

      // ─── Game loop ──────────────────────────────────────────────────
      let glowPhase = 0
      const tickerFn = (ticker: Ticker) => {
        if (!myPlayerId) return
        const avatar = avatarsRef.current.get(myPlayerId)
        if (!avatar) return

        const pos = myPositionRef.current
        let moved = false

        // Keyboard movement
        if (!isChatFocused) {
          const keys = keysRef.current
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
        const moveTo = moveToRef.current
        if (moveTo && !moved) {
          const dx = moveTo.target.x - pos.x
          const dy = moveTo.target.y - pos.y
          const dist = Math.hypot(dx, dy)
          if (dist < MOVE_SPEED) {
            pos.x = moveTo.target.x
            pos.y = moveTo.target.y
            moveTo.indicator.destroy()
            moveToRef.current = null
            // Trigger arrival ripple
            const rippleGfx = new Graphics()
            app.stage.addChild(rippleGfx)
            rippleRef.current = {
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
        const trail = trailRef.current
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
        const trailGfx = trailGfxRef.current
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
        const ripple = rippleRef.current
        if (ripple) {
          const elapsed = Date.now() - ripple.startTime
          const progress = elapsed / 500
          if (progress >= 1) {
            ripple.gfx.destroy()
            rippleRef.current = null
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
          if (
            now - lastBroadcastRef.current >=
            POSITION_BROADCAST_INTERVAL_MS
          ) {
            lastBroadcastRef.current = now
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({
                  type: 'move',
                  position: { x: pos.x, y: pos.y },
                })
              )
            }
            onPositionUpdate?.({ x: pos.x, y: pos.y })
          }
        }

        // Update ambient particles
        for (const p of particlesRef.current) {
          p.gfx.x += p.vx
          p.gfx.y += p.vy
          if (p.gfx.x < 0) p.gfx.x = CANVAS_WIDTH
          if (p.gfx.x > CANVAS_WIDTH) p.gfx.x = 0
          if (p.gfx.y < 0) p.gfx.y = CANVAS_HEIGHT
          if (p.gfx.y > CANVAS_HEIGHT) p.gfx.y = 0
        }

        // Animate zone boundaries (dashed border with flowing effect)
        zoneDashOffsetRef.current += 0.5
        ledPhaseRef.current += ticker.deltaTime * 0.05
        const zoneGfx = zoneGfxRef.current
        if (zoneGfx) {
          zoneGfx.clear()
          const offset = zoneDashOffsetRef.current
          const privateZones = ZONES.filter((z) => z.isPrivate)

          for (const zone of privateZones) {
            const { x, y, width, height } = zone.bounds
            const dashLen = 8
            const gapLen = 6
            const doorwayGap = 30
            const totalLen = dashLen + gapLen

            // Draw dashed border with doorway gap on bottom side
            const drawDashedLine = (
              x1: number,
              y1: number,
              x2: number,
              y2: number,
              skipStart: number,
              skipEnd: number
            ) => {
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
                zoneGfx
                  .moveTo(x1 + nx * d, y1 + ny * d)
                  .lineTo(x1 + nx * segEnd, y1 + ny * segEnd)
                  .stroke()
                d += totalLen
              }
            }

            zoneGfx.setStrokeStyle({
              width: 1,
              color: ELECTRIC_CYAN,
              alpha: 0.4,
            })

            // Top
            drawDashedLine(x, y, x + width, y, Infinity, -Infinity)
            // Right
            drawDashedLine(
              x + width,
              y,
              x + width,
              y + height,
              Infinity,
              -Infinity
            )
            // Bottom (with doorway gap in center)
            const bottomCenter = width / 2
            drawDashedLine(
              x,
              y + height,
              x + width,
              y + height,
              bottomCenter - doorwayGap / 2,
              bottomCenter + doorwayGap / 2
            )
            // Left
            drawDashedLine(x, y + height, x, y, Infinity, -Infinity)

            // Back Room blinking LEDs
            if (zone.id === 'private-b') {
              const phase = ledPhaseRef.current
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
        zoneEntryParticlesRef.current = zoneEntryParticlesRef.current.filter(
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

      tickerRef.current = tickerFn
      app.ticker.add(tickerFn)

      // Cleanup
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
        window.removeEventListener('resize', updateScale)
        window.removeEventListener('orientationchange', updateScale)
      }
    }

    init()

    const avatars = avatarsRef.current
    return () => {
      destroyed = true
      if (appRef.current) {
        if (tickerRef.current) {
          appRef.current.ticker.remove(tickerRef.current)
        }
        appRef.current.destroy(true)
        appRef.current = null
      }
      avatars.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayerId, myColor])

  // ─── Handle server messages ──────────────────────────────────────────────
  const handleServerMessage = useCallback(
    (data: string) => {
      const app = appRef.current
      if (!app) return

      let msg
      try {
        msg = JSON.parse(data)
      } catch {
        return
      }

      switch (msg.type) {
        case 'player_joined': {
          const p = msg.player
          if (p.id === myPlayerId) return
          if (avatarsRef.current.has(p.id)) return
          const avatar = createAvatar(
            p.id,
            p.avatarColor ?? ELECTRIC_CYAN,
            p.displayName ?? p.id.slice(0, 6),
            p.position ?? { x: 600, y: 400 },
            false
          )
          app.stage.addChild(avatar)
          break
        }
        case 'position_update': {
          for (const upd of msg.updates as PositionUpdate[]) {
            if (upd.playerId === myPlayerId) continue
            const avatar = avatarsRef.current.get(upd.playerId)
            if (avatar) {
              // Smooth lerp for remote avatars
              avatar.container.x += (upd.position.x - avatar.container.x) * 0.3
              avatar.container.y += (upd.position.y - avatar.container.y) * 0.3
            }
          }
          break
        }
        case 'zone_update': {
          if (msg.playerId === myPlayerId && msg.zone !== myZoneRef.current) {
            const prevZone = myZoneRef.current
            myZoneRef.current = msg.zone
            onZoneChange?.(msg.zone)

            // Spawn entry particles when entering a private zone
            if (msg.zone !== 'main' && prevZone !== msg.zone) {
              const pos = myPositionRef.current
              const zoneColors: Record<string, number> = {
                'private-a': 0xa78bfa, // violet for Corner Booth
                'private-b': 0x38bdf8, // sky blue for Back Room
                'private-c': MATRIX_GREEN, // green for Side Hall
              }
              const app = appRef.current
              if (app) {
                spawnZoneEntryParticles(
                  app.stage,
                  pos.x,
                  pos.y,
                  zoneColors[msg.zone] ?? ELECTRIC_CYAN
                )
              }
            }
          }
          break
        }
        case 'player_left': {
          const avatar = avatarsRef.current.get(msg.playerId)
          if (avatar) {
            avatar.container.destroy()
            avatarsRef.current.delete(msg.playerId)
          }
          break
        }
      }
    },
    [myPlayerId, createAvatar, onZoneChange, spawnZoneEntryParticles]
  )

  // Expose message handler via ref for parent
  const messageHandlerRef = useRef(handleServerMessage)
  messageHandlerRef.current = handleServerMessage

  // Listen for socket messages
  useEffect(() => {
    if (!socket) return
    const handler = (e: MessageEvent) => {
      messageHandlerRef.current(e.data)
    }
    socket.addEventListener('message', handler)
    return () => socket.removeEventListener('message', handler)
  }, [socket])

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center overflow-hidden touch-manipulation"
      style={{
        width: '100%',
        height: '100%',
        maxWidth: CANVAS_WIDTH,
        maxHeight: CANVAS_HEIGHT,
      }}
    />
  )
}
