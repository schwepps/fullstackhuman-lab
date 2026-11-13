'use client'

import { useEffect, useState } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const BLOCKS_PER_DAY = [1, 2, 2, 3, 4]
const BLOCK_COLORS = [
  'bg-green',
  'bg-green',
  'bg-amber',
  'bg-amber',
  'bg-glitch',
  'bg-glitch',
  'bg-magenta',
]
const FIRST_DROP_S = 0.35
const DROP_GAP_S = 0.16
const FINAL_SANITY = -12

type Block = { day: number; index: number; order: number }

const BLOCKS: Block[] = BLOCKS_PER_DAY.flatMap((count, day) =>
  Array.from({ length: count }, (_, index) => ({ day, index, order: 0 }))
).map((block, order) => ({ ...block, order }))

/** Decorative mini calendar: blocks pile up while the sanity readout drops. */
export function HeroPreview() {
  const [sanity, setSanity] = useState(100)

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const step = Math.round((100 - FINAL_SANITY) / BLOCKS.length)
    const timers = BLOCKS.map((block) =>
      setTimeout(
        () =>
          setSanity((s) =>
            block.order === BLOCKS.length - 1
              ? FINAL_SANITY
              : Math.max(FINAL_SANITY, s - step)
          ),
        reduced ? 0 : (FIRST_DROP_S + block.order * DROP_GAP_S) * 1000 + 250
      )
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div
      className="notch-24 scanlines relative bg-ink p-5 text-paper"
      aria-hidden="true"
    >
      <div className="pixel mb-3.5 flex justify-between text-signal">
        <span>AI calendar</span>
        <span>Sanity {sanity}%</span>
      </div>
      <div className="grid h-56 grid-cols-5 gap-1.5">
        {DAYS.map((day, dayIndex) => (
          <div
            key={day}
            className="flex flex-col gap-1.5 border-l border-ink-line p-1"
          >
            <b className="pixel mb-1 text-[0.7rem] font-normal text-on-ink-muted">
              {day}
            </b>
            {BLOCKS.filter((block) => block.day === dayIndex).map((block) => (
              <i
                key={block.order}
                className={`animate-drop block ${BLOCK_COLORS[Math.min(block.order, BLOCK_COLORS.length - 1)]}`}
                style={{
                  height: `${14 + ((block.order * 7) % 16)}px`,
                  rotate: `${(block.index % 2 ? 1 : -1) * dayIndex * 2.2}deg`,
                  animationDelay: `${FIRST_DROP_S + block.order * DROP_GAP_S}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
