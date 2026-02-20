import { cn } from '@/lib/utils'

interface IllustrationProps {
  className?: string
}

export function CriticIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-20', className)}
    >
      {/* Magnifying glass lens */}
      <circle cx="34" cy="34" r="18" stroke="currentColor" strokeWidth="2" />

      {/* Inner scan ring */}
      <circle
        cx="34"
        cy="34"
        r="12"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.5"
      />

      {/* Crosshair inside lens */}
      <line
        x1="34"
        y1="22"
        x2="34"
        y2="46"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />
      <line
        x1="22"
        y1="34"
        x2="46"
        y2="34"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />

      {/* Eye / eyebrow inside lens — the "critic's gaze" */}
      <path
        d="M26 34 C26 34 30 28 34 28 C38 28 42 34 42 34"
        stroke="var(--color-accent, #4ade80)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle
        cx="34"
        cy="33"
        r="2"
        fill="var(--color-accent, #4ade80)"
        opacity="0.9"
      />
      {/* Raised eyebrow */}
      <path
        d="M27 27 C29 24 33 23 37 24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Handle */}
      <line
        x1="47"
        y1="47"
        x2="66"
        y2="66"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Scan lines across lens */}
      <line
        x1="20"
        y1="30"
        x2="48"
        y2="30"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.15"
      />
      <line
        x1="20"
        y1="34"
        x2="48"
        y2="34"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.15"
      />
      <line
        x1="20"
        y1="38"
        x2="48"
        y2="38"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.15"
      />

      {/* Small data points */}
      <circle cx="68" cy="14" r="1" fill="currentColor" opacity="0.3" />
      <circle cx="72" cy="18" r="1" fill="currentColor" opacity="0.3" />
      <circle cx="70" cy="10" r="1" fill="currentColor" opacity="0.3" />

      {/* Glitch line */}
      <line
        x1="2"
        y1="72"
        x2="14"
        y2="72"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  )
}
