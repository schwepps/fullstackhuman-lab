export function FshLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4,2 C2,2 1,3 1,5 L1,10 C1,11 0,12 0,12 C0,12 1,13 1,14 L1,19 C1,21 2,22 4,22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polyline
        points="21,4 16,4 16,11 21,11 21,20 16,20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="8" y1="4" x2="8" y2="20" />
        <line x1="8" y1="4" x2="14" y2="4" />
        <line x1="8" y1="12" x2="13" y2="12" />
        <line x1="24" y1="4" x2="24" y2="20" />
        <line x1="24" y1="12" x2="30" y2="12" />
        <line x1="30" y1="4" x2="30" y2="20" />
      </g>
      <path
        d="M36,2 C38,2 39,3 39,5 L39,10 C39,11 40,12 40,12 C40,12 39,13 39,14 L39,19 C39,21 38,22 36,22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
