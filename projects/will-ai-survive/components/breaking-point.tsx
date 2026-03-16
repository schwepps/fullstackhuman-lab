'use client'

type BreakingPointProps = {
  content: string
}

const MIN_HEADLINE_LENGTH = 40

/**
 * Splits the breaking point text into a headline (first meaningful sentence)
 * and the remaining detail. If the first sentence is too short (e.g. "Day 11."),
 * it tries the next sentence boundary or falls back to showing the full text.
 */
function splitHeadline(text: string): { headline: string; detail: string } {
  // Find all sentence boundaries
  const sentenceEnd = /[.!?]\s+/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = sentenceEnd.exec(text)) !== null) {
    const candidate = text.slice(0, match.index + 1)
    if (candidate.length >= MIN_HEADLINE_LENGTH) {
      const rest = text.slice(match.index + match[0].length).trim()
      return { headline: candidate, detail: rest }
    }
    lastIndex = match.index + match[0].length
  }

  // No good split found — check if text after last short sentence is long enough
  if (lastIndex > 0 && lastIndex < text.length) {
    // Combine short prefix with next sentence as headline
    const nextMatch = text.slice(lastIndex).match(/^(.+?[.!?])(\s+[\s\S]*)?$/)
    if (nextMatch) {
      const headline = text.slice(0, lastIndex) + nextMatch[1]
      const detail = nextMatch[2]?.trim() ?? ''
      return { headline, detail }
    }
  }

  // No split possible — show full text
  return { headline: text, detail: '' }
}

export function BreakingPoint({ content }: BreakingPointProps) {
  const { headline, detail } = splitHeadline(content)

  return (
    <div className="animate-scale-in flex flex-col gap-0">
      {/* Label outside the dark card — provides context */}
      <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
        The Moment AI Snapped
      </p>

      {/* Dark dramatic card with left accent border */}
      <div className="overflow-hidden rounded-lg bg-foreground shadow-lg">
        <div className="h-0.75 w-full bg-accent" />
        <div className="border-l-4 border-l-accent px-6 py-8 sm:px-10 sm:py-10">
          {/* Pull-quote headline — large, prominent */}
          <blockquote className="text-lg leading-relaxed font-medium text-white sm:text-xl">
            &ldquo;{headline}&rdquo;
          </blockquote>

          {/* Supporting detail — smaller, dimmer */}
          {detail && (
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              {detail}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
