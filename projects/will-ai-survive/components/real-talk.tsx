import Markdown from 'react-markdown'

export function RealTalk({ insight }: { insight: string }) {
  return (
    <article className="notch-16 animate-rise border-2 border-ink bg-card">
      <div className="pixel bg-ink px-4 py-2.5 text-signal">Real talk</div>
      <div className="prose-real-talk px-4.5 pt-4 pb-5 lg:px-6.5 lg:pt-5.5 lg:pb-6.5">
        <Markdown>{insight}</Markdown>
      </div>
    </article>
  )
}
