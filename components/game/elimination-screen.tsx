'use client'

import { useState, useEffect } from 'react'

type EliminationScreenProps = {
  displayName: string
  onComplete: () => void
}

const DISPLAY_DURATION_MS = 3000

export function EliminationScreen({
  displayName,
  onComplete,
}: EliminationScreenProps) {
  const [opacity, setOpacity] = useState(1)
  const [flashOpacity, setFlashOpacity] = useState(0.15)

  // Red flash fade
  useEffect(() => {
    const flashTimer = setTimeout(() => setFlashOpacity(0), 300)
    return () => clearTimeout(flashTimer)
  }, [])

  // Auto-fade and unmount
  useEffect(() => {
    const fadeTimer = setTimeout(() => setOpacity(0), DISPLAY_DURATION_MS - 500)
    const unmountTimer = setTimeout(onComplete, DISPLAY_DURATION_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(unmountTimer)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0c]/95 transition-opacity duration-500"
      style={{ opacity }}
    >
      {/* Red flash overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#ef4444] transition-opacity duration-300"
        style={{ opacity: flashOpacity }}
      />

      <div className="relative border border-[#1e293b] p-6 text-center font-mono sm:p-10">
        <p className="animate-pulse text-xl font-bold text-[#ef4444] lg:text-3xl">
          [{displayName.toUpperCase()}]
        </p>
        <p className="mt-2 text-xl font-bold text-[#ef4444] lg:text-3xl">
          HAS BEEN ELIMINATED
        </p>
      </div>
    </div>
  )
}
