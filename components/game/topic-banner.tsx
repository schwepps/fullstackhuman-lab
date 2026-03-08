'use client'

import { useState, useEffect, useRef } from 'react'

type TopicBannerProps = {
  round: number
  topic: string
  roundDuration: number
  roundStartedAt: number
}

export function TopicBanner({
  round,
  topic,
  roundDuration,
  roundStartedAt,
}: TopicBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(roundDuration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const update = () => {
      const elapsed = Math.floor((Date.now() - roundStartedAt) / 1000)
      const remaining = Math.max(0, roundDuration - elapsed)
      setSecondsLeft(remaining)
    }
    update()
    intervalRef.current = setInterval(update, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [roundDuration, roundStartedAt])

  const isUrgent = secondsLeft < 10

  return (
    <div className="w-full border-b border-[#22d3ee] bg-[#0a0a0c] p-3 font-mono sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-bold text-[#22d3ee]">ROUND {round}</span>
          <span className="text-[#94a3b8]">{' // '}</span>
          <span className="text-base text-[#e2e8f0] sm:text-sm">
            {topic.toUpperCase()}
          </span>
        </div>
        <div
          className={`shrink-0 text-lg font-bold sm:text-xl ${
            isUrgent ? 'animate-pulse text-[#ef4444]' : 'text-[#f59e0b]'
          }`}
        >
          T-{secondsLeft}s
        </div>
      </div>
    </div>
  )
}
