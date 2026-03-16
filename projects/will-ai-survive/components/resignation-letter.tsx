'use client'

type ResignationLetterProps = {
  content: string
}

export function ResignationLetter({ content }: ResignationLetterProps) {
  return (
    <div className="animate-fade-in flex flex-col gap-0">
      {/* Label */}
      <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Resignation Letter
      </p>

      {/* Letter card — paper-like with visible border */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-linear-to-b from-white to-slate-50 shadow-sm">
        <div className="h-0.75 w-full bg-accent" />

        {/* "FILED" watermark — small, very faint, properly centered */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 animate-stamp select-none"
          aria-hidden="true"
        >
          <span className="font-mono text-5xl font-black uppercase tracking-[0.2em] text-red-500/8 sm:text-6xl">
            Filed
          </span>
        </div>

        <div className="relative px-6 py-6 sm:px-8 sm:py-8">
          {/* Author line */}
          <p className="mb-5 border-b border-border pb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            From: AI (Employee #&infin;)
          </p>

          {/* Letter content */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}
