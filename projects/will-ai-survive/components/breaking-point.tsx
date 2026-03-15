'use client'

type BreakingPointProps = {
  content: string
}

export function BreakingPoint({ content }: BreakingPointProps) {
  return (
    <div className="animate-scale-in overflow-hidden rounded-xl bg-foreground p-6 text-surface shadow-lg sm:p-8">
      <h3 className="mb-4 text-center font-mono text-xs font-bold uppercase tracking-[0.2em] text-danger">
        The Moment AI Snapped
      </h3>
      <p className="text-center text-lg leading-relaxed sm:text-xl">
        &ldquo;{content}&rdquo;
      </p>
    </div>
  )
}
