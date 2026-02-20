import { cn } from '@/lib/utils'

interface IllustrationProps {
  className?: string
}

export function GuideIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-20', className)}
    >
      {/* Outer compass ring */}
      <circle cx="40" cy="40" r="26" stroke="currentColor" strokeWidth="2" />
      <circle
        cx="40"
        cy="40"
        r="22"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeDasharray="2 4"
        opacity="0.4"
      />

      {/* Cardinal tick marks */}
      <line
        x1="40"
        y1="14"
        x2="40"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="40"
        y1="60"
        x2="40"
        y2="66"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="40"
        x2="20"
        y2="40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="40"
        x2="66"
        y2="40"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Compass needle — north (green accent) */}
      <polygon
        points="40,18 37,40 43,40"
        fill="var(--color-accent, #4ade80)"
        opacity="0.8"
      />
      {/* Compass needle — south */}
      <polygon points="40,62 37,40 43,40" fill="currentColor" opacity="0.3" />

      {/* Center pivot */}
      <circle cx="40" cy="40" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="1" fill="currentColor" />

      {/* Holographic rays */}
      <line
        x1="40"
        y1="18"
        x2="40"
        y2="6"
        stroke="var(--color-accent, #4ade80)"
        strokeWidth="1"
        opacity="0.4"
      />
      <line
        x1="44"
        y1="19"
        x2="50"
        y2="8"
        stroke="var(--color-accent, #4ade80)"
        strokeWidth="0.75"
        opacity="0.25"
      />
      <line
        x1="36"
        y1="19"
        x2="30"
        y2="8"
        stroke="var(--color-accent, #4ade80)"
        strokeWidth="0.75"
        opacity="0.25"
      />

      {/* Orbiting waypoint markers */}
      <circle
        cx="12"
        cy="24"
        r="2"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <circle cx="12" cy="24" r="0.75" fill="currentColor" opacity="0.5" />

      <circle
        cx="68"
        cy="56"
        r="2"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <circle cx="68" cy="56" r="0.75" fill="currentColor" opacity="0.5" />

      <circle
        cx="60"
        cy="16"
        r="1.5"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.3"
      />

      {/* Glitch accent */}
      <line
        x1="2"
        y1="70"
        x2="12"
        y2="70"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="68"
        y1="10"
        x2="78"
        y2="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  )
}
