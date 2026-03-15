'use client'

import { useEffect, useState } from 'react'

type ChaosMeterProps = {
  rating: number
  label: string
  survivalDuration: string
}

const CHAOS_COLORS = {
  low: { bg: 'bg-safe/8', border: 'border-safe/20', text: 'text-safe' },
  mid: {
    bg: 'bg-warning/8',
    border: 'border-warning/20',
    text: 'text-warning',
  },
  high: { bg: 'bg-danger/8', border: 'border-danger/20', text: 'text-danger' },
} as const

function getChaosLevel(rating: number) {
  if (rating <= 3) return CHAOS_COLORS.low
  if (rating <= 6) return CHAOS_COLORS.mid
  return CHAOS_COLORS.high
}

export function ChaosMeter({
  rating,
  label,
  survivalDuration,
}: ChaosMeterProps) {
  const [displayRating, setDisplayRating] = useState(0)
  const colors = getChaosLevel(rating)

  // Animated count-up from 0 to rating
  useEffect(() => {
    const duration = 1000
    const steps = rating
    const stepTime = duration / steps
    let current = 0

    const timer = setInterval(() => {
      current++
      setDisplayRating(current)
      if (current >= rating) clearInterval(timer)
    }, stepTime)

    return () => clearInterval(timer)
  }, [rating])

  return (
    <div
      className={`animate-scale-in rounded-xl border p-6 ${colors.bg} ${colors.border}`}
    >
      {/* Rating number — hero element */}
      <div className="mb-4 text-center">
        <div className={`font-mono text-7xl font-black ${colors.text}`}>
          {displayRating}
          <span className="text-2xl text-muted">/10</span>
        </div>
      </div>

      {/* Chaos label — the quotable punchline */}
      <p className="mb-6 text-center text-lg font-medium leading-snug">
        &ldquo;{label}&rdquo;
      </p>

      {/* Survival duration */}
      <div className="border-t border-border-dim pt-4 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          AI Survived
        </p>
        <p className="mt-1 font-mono text-xl font-bold">{survivalDuration}</p>
      </div>
    </div>
  )
}
