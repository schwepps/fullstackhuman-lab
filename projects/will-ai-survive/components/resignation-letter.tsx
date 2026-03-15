'use client'

type ResignationLetterProps = {
  content: string
}

export function ResignationLetter({ content }: ResignationLetterProps) {
  return (
    <div className="animate-fade-in">
      <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
        Resignation Letter
      </h3>
      <div className="paper relative overflow-hidden px-6 py-8 sm:px-8">
        {/* "INCIDENT REPORT" watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none font-mono text-6xl font-black uppercase tracking-[0.3em] text-foreground/3 sm:text-7xl">
            FILED
          </span>
        </div>

        {/* Author line */}
        <p className="relative mb-4 font-mono text-xs uppercase tracking-wider text-muted">
          From: AI (Employee #&infin;)
        </p>

        {/* Letter content */}
        <div className="relative whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
          {content}
        </div>
      </div>
    </div>
  )
}
