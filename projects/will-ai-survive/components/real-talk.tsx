'use client'

import Markdown from 'react-markdown'

type RealTalkProps = {
  insight: string
}

export function RealTalk({ insight }: RealTalkProps) {
  return (
    <div className="animate-fade-in rounded-xl border border-safe/20 bg-safe/5 p-6">
      <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-safe">
        Real Talk
      </h3>
      <div className="prose-real-talk text-sm leading-relaxed text-foreground/90">
        <Markdown>{insight}</Markdown>
      </div>
    </div>
  )
}
