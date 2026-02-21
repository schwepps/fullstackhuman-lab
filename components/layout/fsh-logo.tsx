import { cn } from '@/lib/utils'

interface FshLogoProps {
  className?: string
}

/**
 * Icon mark: {FSH} as pure SVG geometry.
 * Uses currentColor — inherits text-primary from parent.
 */
export function FshIconMark({ className }: FshLogoProps) {
  return (
    <svg
      viewBox="0 0 40 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('h-7 w-auto', className)}
    >
      {/* { open curly brace — thinner for visual hierarchy */}
      <path
        d="M4,2 C2,2 1,3 1,5 L1,10 C1,11 0,12 0,12 C0,12 1,13 1,14 L1,19 C1,21 2,22 4,22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* F */}
      <line
        x1="8"
        y1="4"
        x2="8"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="4"
        x2="14"
        y2="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="12"
        x2="13"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* S — geometric form for small-size legibility */}
      <polyline
        points="21,4 16,4 16,11 21,11 21,20 16,20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* H */}
      <line
        x1="24"
        y1="4"
        x2="24"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="12"
        x2="30"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="30"
        y1="4"
        x2="30"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* } close curly brace — mirrored */}
      <path
        d="M36,2 C38,2 39,3 39,5 L39,10 C39,11 40,12 40,12 C40,12 39,13 39,14 L39,19 C39,21 38,22 36,22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * Full wordmark: {FSH} icon + FULL_STACK_HUMAN text.
 * Used at desktop sizes in the header.
 */
export function FshWordmark({ className }: FshLogoProps) {
  return (
    <svg
      viewBox="0 0 170 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FULL_STACK_HUMAN"
      className={cn('h-7 w-auto', className)}
    >
      {/* { open curly brace */}
      <path
        d="M4,2 C2,2 1,3 1,5 L1,10 C1,11 0,12 0,12 C0,12 1,13 1,14 L1,19 C1,21 2,22 4,22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* F */}
      <line
        x1="8"
        y1="4"
        x2="8"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="4"
        x2="14"
        y2="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="12"
        x2="13"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* S */}
      <polyline
        points="21,4 16,4 16,11 21,11 21,20 16,20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* H */}
      <line
        x1="24"
        y1="4"
        x2="24"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="12"
        x2="30"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="30"
        y1="4"
        x2="30"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* } close curly brace */}
      <path
        d="M36,2 C38,2 39,3 39,5 L39,10 C39,11 40,12 40,12 C40,12 39,13 39,14 L39,19 C39,21 38,22 36,22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Separator line */}
      <line
        x1="46"
        y1="5"
        x2="46"
        y2="19"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.3"
      />

      {/* FULL_STACK_HUMAN text */}
      <text
        x="52"
        y="16.5"
        fontFamily="'Geist Mono', 'Courier New', monospace"
        fontSize="10.5"
        fontWeight="700"
        letterSpacing="0.1em"
        fill="currentColor"
      >
        FULL_STACK_HUMAN
      </text>
    </svg>
  )
}
