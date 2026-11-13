const BLOCK_DELAYS_MS = [0, 150, 300, 450]

type PixelLoaderProps = {
  label: string
  className?: string
}

export function PixelLoader({ label, className = '' }: PixelLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pixel flex items-center gap-3 text-magenta ${className}`}
    >
      <span className="flex gap-1.5" aria-hidden="true">
        {BLOCK_DELAYS_MS.map((delay) => (
          <span
            key={delay}
            className="animate-pixel-load size-3 bg-current opacity-20"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span>
        {label}
        <span className="animate-blink" aria-hidden="true">
          _
        </span>
      </span>
    </div>
  )
}
