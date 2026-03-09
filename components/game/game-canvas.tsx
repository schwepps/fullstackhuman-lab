'use client'

import { useEffect, useRef, useCallback } from 'react'
import 'pixi.js/unsafe-eval'
import { Application, Graphics } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import type { Position, ZoneType } from '@/lib/game/types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_SPAWN_POSITION,
} from '@/lib/game/constants'
import { createParticles, createAvatar } from './canvas-renderer'
import type {
  AvatarData,
  Particle,
  GhostTrail,
  MoveToTarget,
  ZoneEntryParticle,
} from './canvas-renderer'
import { drawRoom, drawZoneBackgrounds } from './canvas-drawing'
import { createGameTicker } from './canvas-ticker'
import { setupKeyboardHandlers, setupDoubleTapHandler } from './canvas-input'
import { handleServerMessage } from './canvas-messages'

type GameCanvasProps = {
  socket: WebSocket | null
  myPlayerId: string | null
  myDisplayName?: string | null
  myColor: number
  isChatFocused: boolean
  onPositionUpdate?: (position: Position) => void
  onZoneChange?: (zone: ZoneType) => void
}

export function GameCanvas({
  socket,
  myPlayerId,
  myDisplayName,
  myColor,
  isChatFocused,
  onPositionUpdate,
  onZoneChange,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const avatarsRef = useRef<Map<string, AvatarData>>(new Map())
  const myPositionRef = useRef<Position>({ ...DEFAULT_SPAWN_POSITION })
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
  const isChatFocusedRef = useRef(isChatFocused)
  const socketRef = useRef(socket)

  useEffect(() => {
    isChatFocusedRef.current = isChatFocused
  }, [isChatFocused])
  useEffect(() => {
    socketRef.current = socket
  }, [socket])

  const updateScale = useCallback(() => {
    if (!containerRef.current || !appRef.current) return
    const parent = containerRef.current
    const scale = Math.min(
      parent.clientWidth / CANVAS_WIDTH,
      parent.clientHeight / CANVAS_HEIGHT,
      1
    )
    scaleRef.current = scale
    const canvas = appRef.current.canvas as HTMLCanvasElement
    canvas.style.transform = `scale(${scale})`
    canvas.style.transformOrigin = 'top left'
  }, [])

  // ─── Initialize PixiJS ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false
    const app = new Application()

    const init = async () => {
      await app.init({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: 0x0a0a0c,
        antialias: true,
      })
      if (destroyed) return
      appRef.current = app
      const canvas = app.canvas as HTMLCanvasElement
      canvas.style.touchAction = 'manipulation'
      containerRef.current?.appendChild(canvas)

      drawRoom(app.stage)
      zoneGfxRef.current = drawZoneBackgrounds(app.stage)
      particlesRef.current = createParticles(app.stage)

      const trailGfx = new Graphics()
      app.stage.addChild(trailGfx)
      trailGfxRef.current = trailGfx

      if (myPlayerId) {
        app.stage.addChild(
          createAvatar(
            myPlayerId,
            myColor,
            myDisplayName ?? 'You',
            myPositionRef.current,
            true,
            avatarsRef.current
          )
        )
      }

      const { handleKeyDown, handleKeyUp } = setupKeyboardHandlers(
        keysRef,
        moveToRef
      )
      const { handleTouchStart, handleDblClick } = setupDoubleTapHandler(
        canvas,
        app.stage,
        scaleRef,
        lastTapRef,
        moveToRef
      )

      updateScale()
      window.addEventListener('resize', updateScale)
      window.addEventListener('orientationchange', updateScale)

      if (myPlayerId) {
        const tickerFn = createGameTicker({
          app,
          myPlayerId,
          avatars: avatarsRef.current,
          myPosition: myPositionRef,
          keys: keysRef,
          moveToTarget: moveToRef,
          trail: trailRef,
          trailGfx: trailGfxRef,
          ripple: rippleRef,
          particles: particlesRef,
          zoneEntryParticles: zoneEntryParticlesRef,
          zoneDashOffset: zoneDashOffsetRef,
          ledPhase: ledPhaseRef,
          zoneGfx: zoneGfxRef,
          lastBroadcast: lastBroadcastRef,
          isChatFocused: isChatFocusedRef,
          socket: socketRef,
          onPositionUpdate,
        })
        tickerRef.current = tickerFn
        app.ticker.add(tickerFn)
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
        window.removeEventListener('resize', updateScale)
        window.removeEventListener('orientationchange', updateScale)
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('dblclick', handleDblClick)
      }
    }

    init()
    const avatars = avatarsRef.current
    return () => {
      destroyed = true
      if (appRef.current) {
        if (tickerRef.current) appRef.current.ticker.remove(tickerRef.current)
        appRef.current.destroy(true)
        appRef.current = null
      }
      avatars.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPlayerId, myColor, myDisplayName])

  // ─── Handle server messages ──────────────────────────────────────────────
  const onMessage = useCallback(
    (data: string) => {
      const app = appRef.current
      if (!app) return
      handleServerMessage(data, {
        app,
        myPlayerId,
        avatars: avatarsRef.current,
        myPosition: myPositionRef,
        myZone: myZoneRef,
        zoneEntryParticles: zoneEntryParticlesRef,
        onZoneChange,
      })
    },
    [myPlayerId, onZoneChange]
  )

  const messageHandlerRef = useRef(onMessage)
  messageHandlerRef.current = onMessage

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
