'use client'

import { useEffect, useState } from 'react'

const CHARS_PER_TICK = 3
const TICK_MS = 12

type OutOfOfficeProps = {
  letter: string
  subject: string | null
  animate: boolean
}

export function OutOfOffice({ letter, subject, animate }: OutOfOfficeProps) {
  const [shown, setShown] = useState(animate ? 0 : letter.length)
  const isTyping = shown < letter.length

  useEffect(() => {
    if (!animate || !isTyping) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = setInterval(
      () => setShown((n) => (reduced ? letter.length : n + CHARS_PER_TICK)),
      TICK_MS
    )
    return () => clearInterval(timer)
  }, [animate, letter, isTyping])

  return (
    <article className="notch-16 animate-rise border-2 border-ink bg-card">
      <div className="pixel bg-amber px-4 py-2.5 text-ink">Automatic reply</div>
      <div className="px-4.5 pt-4 pb-5 lg:px-6.5 lg:pt-5.5 lg:pb-6.5">
        <p className="pixel mb-2.5 text-ink-muted">
          Re: your workweek. {subject || 'Out of office, permanently'}
        </p>
        <p className="sr-only">{letter}</p>
        <div className="max-w-[62ch] whitespace-pre-line" aria-hidden="true">
          {letter.slice(0, shown)}
          {isTyping && <span className="animate-blink">_</span>}
        </div>
      </div>
    </article>
  )
}
