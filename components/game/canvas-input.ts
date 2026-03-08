import { Graphics } from 'pixi.js'
import type { MutableRefObject } from 'react'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  AVATAR_RADIUS,
  DOUBLE_TAP_THRESHOLD_MS,
  DOUBLE_TAP_DISTANCE_PX,
} from '@/lib/game/constants'
import { MATRIX_GREEN } from './canvas-renderer'
import type { MoveToTarget } from './canvas-renderer'

export function setupKeyboardHandlers(
  keysRef: MutableRefObject<Set<string>>,
  moveToRef: MutableRefObject<MoveToTarget | null>
) {
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

  return { handleKeyDown, handleKeyUp }
}

export function setupDoubleTapHandler(
  canvas: HTMLCanvasElement,
  stage: import('pixi.js').Container,
  scaleRef: MutableRefObject<number>,
  lastTapRef: MutableRefObject<{ time: number; x: number; y: number } | null>,
  moveToRef: MutableRefObject<MoveToTarget | null>
) {
  const handleTapStart = (clientX: number, clientY: number) => {
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
      const clampedX = Math.max(
        AVATAR_RADIUS,
        Math.min(CANVAS_WIDTH - AVATAR_RADIUS, gameX)
      )
      const clampedY = Math.max(
        AVATAR_RADIUS,
        Math.min(CANVAS_HEIGHT - AVATAR_RADIUS, gameY)
      )

      if (moveToRef.current) moveToRef.current.indicator.destroy()

      const indicator = new Graphics()
      indicator.setStrokeStyle({ width: 1, color: MATRIX_GREEN, alpha: 0.5 })
      const sz = 8
      indicator
        .moveTo(clampedX - sz, clampedY)
        .lineTo(clampedX + sz, clampedY)
        .stroke()
      indicator
        .moveTo(clampedX, clampedY - sz)
        .lineTo(clampedX, clampedY + sz)
        .stroke()
      stage.addChild(indicator)

      moveToRef.current = { target: { x: clampedX, y: clampedY }, indicator }
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
}
