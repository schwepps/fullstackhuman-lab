'use client'

import { useEffect, useState } from 'react'

type ChaosMeterProps = {
  rating: number
  label: string
  survivalDuration: string
  /** Set to false on SSR pages to show the final value immediately */
  animate?: boolean
}

const CHAOS_STYLES = {
  low: {
    text: 'text-safe',
    accentBg: 'bg-safe',
    cardBorder: 'border-safe/20',
    glow: 'shadow-[0_0_30px_rgb(5_150_105/0.12)]',
  },
  mid: {
    text: 'text-warning',
    accentBg: 'bg-warning',
    cardBorder: 'border-warning/20',
    glow: 'shadow-[0_0_30px_rgb(217_119_6/0.12)]',
  },
  high: {
    text: 'text-danger',
    accentBg: 'bg-danger',
    cardBorder: 'border-danger/20',
    glow: 'shadow-[0_0_30px_rgb(220_38_38/0.15)]',
  },
} as const

function getChaosLevel(rating: number) {
  if (rating <= 3) return CHAOS_STYLES.low
  if (rating <= 6) return CHAOS_STYLES.mid
  return CHAOS_STYLES.high
}

export function ChaosMeter({
  rating,
  label,
  survivalDuration,
  animate = true,
}: ChaosMeterProps) {
  const [displayRating, setDisplayRating] = useState(animate ? 0 : rating)
  const styles = getChaosLevel(rating)

  useEffect(() => {
    if (!animate) return

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
  }, [rating, animate])

  return (
    <div
      className={`animate-scale-in overflow-hidden rounded-lg border bg-surface ${styles.cardBorder} ${styles.glow}`}
    >
      <div className={`h-0.75 w-full ${styles.accentBg}`} />

      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <p className="mb-6 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Chaos Assessment
        </p>

        <div className="mb-2 text-center">
          <span
            className={`font-mono text-8xl font-black leading-none tracking-tighter ${styles.text} sm:text-9xl`}
          >
            {displayRating}
          </span>
          <span className="ml-1 font-mono text-3xl font-light text-muted-foreground">
            /10
          </span>
        </div>

        <p className="mx-auto max-w-md text-center text-lg leading-snug font-medium text-foreground/80 italic sm:text-xl">
          &ldquo;{label}&rdquo;
        </p>

        <div className="mx-auto my-6 h-px max-w-xs bg-border" />

        <div className="text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            AI Survived
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {survivalDuration}
          </p>
        </div>
      </div>
    </div>
  )
}
