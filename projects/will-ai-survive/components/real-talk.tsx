'use client'

import Markdown from 'react-markdown'

type RealTalkProps = {
  insight: string
}

export function RealTalk({ insight }: RealTalkProps) {
  return (
    <div className="animate-fade-in overflow-hidden rounded-lg border border-brand/20 bg-surface shadow-sm">
      {/* Cyan accent bar — signals constructive tone (FSH Guide persona) */}
      <div className="h-0.75 w-full bg-brand" />

      <div className="px-6 py-6 sm:px-8">
        <h3 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
          Real Talk
        </h3>
        <div className="prose-real-talk text-sm leading-relaxed text-foreground/85">
          <Markdown>{insight}</Markdown>
        </div>
      </div>

      {/* Visual conclusion bar */}
      <div className="border-t border-brand/10 bg-brand-light px-6 py-3 sm:px-8">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.15em] text-brand/60">
          End of incident report
        </p>
      </div>
    </div>
  )
}
