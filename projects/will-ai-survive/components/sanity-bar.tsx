import { SANITY_FLOOR, sanityTone } from '@/lib/calendar'

const FILL_COLORS = { ok: 'bg-green', warn: 'bg-amber', bad: 'bg-magenta' }
const NEGATIVE_FILL =
  'repeating-linear-gradient(-45deg, var(--color-magenta) 0 6px, var(--color-glitch) 6px 12px)'

export function SanityBar({ sanity }: { sanity: number }) {
  const clamped = Math.max(SANITY_FLOOR, Math.min(100, sanity))
  const isBelowZero = sanity < 0

  return (
    <div className="mb-3.5 flex items-center gap-3">
      <span className="pixel">Sanity</span>
      <div
        role="progressbar"
        aria-label="AI sanity"
        aria-valuemin={SANITY_FLOOR}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className="relative flex h-4 flex-1"
      >
        <div className="flex flex-1 justify-end border-2 border-r-0 border-ink bg-[color-mix(in_oklab,var(--color-magenta)_6%,white)]">
          <div
            className="h-full transition-[width] duration-600"
            style={{
              width: `${(Math.min(0, clamped) / SANITY_FLOOR) * 100}%`,
              background: NEGATIVE_FILL,
            }}
          />
        </div>
        <div className="flex flex-3 border-2 border-ink bg-card">
          <div
            className={`h-full transition-[width,background-color] duration-600 ${FILL_COLORS[sanityTone(sanity)]}`}
            style={{ width: `${Math.max(0, clamped)}%` }}
          />
        </div>
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -bottom-1.5 left-1/4 -ml-px w-[3px] bg-ink"
        >
          <span className="absolute top-full left-1/2 mt-0.5 -translate-x-1/2 font-mono text-[0.6875rem] font-semibold">
            0
          </span>
        </span>
      </div>
      <output
        className={`min-w-[5ch] text-right font-mono font-semibold ${isBelowZero ? 'text-magenta' : ''}`}
      >
        {sanity}%
      </output>
      {isBelowZero && (
        <span className="pixel text-[0.6875rem] text-magenta">Below zero</span>
      )}
    </div>
  )
}
