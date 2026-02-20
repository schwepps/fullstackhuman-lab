import { cn } from '@/lib/utils'

interface IllustrationProps {
  className?: string
}

export function DoctorIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-20', className)}
    >
      {/* Stethoscope head — circuit-style */}
      <circle
        cx="40"
        cy="56"
        r="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 2"
      />
      <circle cx="40" cy="56" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="56" r="1.5" fill="currentColor" />

      {/* Tube — circuit trace path */}
      <path
        d="M28 56 C20 56 16 48 16 40 C16 28 24 20 36 20 L44 20 C56 20 64 28 64 40 C64 48 60 56 52 56"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Earpieces */}
      <circle cx="36" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="44" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="36"
        y1="19"
        x2="36"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="44"
        y1="19"
        x2="44"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Heartbeat / pulse line through center */}
      <polyline
        points="8,40 20,40 24,32 28,48 32,36 36,44 40,40 72,40"
        stroke="var(--color-accent, #4ade80)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* Small circuit nodes */}
      <circle cx="16" cy="40" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="64" cy="40" r="1.5" fill="currentColor" opacity="0.5" />

      {/* Glitch line */}
      <line
        x1="2"
        y1="68"
        x2="18"
        y2="68"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <line
        x1="62"
        y1="12"
        x2="78"
        y2="12"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  )
}
