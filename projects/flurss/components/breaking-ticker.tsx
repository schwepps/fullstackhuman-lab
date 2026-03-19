import type { Article } from '@/lib/types'

export function BreakingTicker({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null

  const tickerText = articles
    .map(
      (a) =>
        `\u2605 ${a.urgency === 'breaking' ? 'URGENT' : 'FLASH'} \u2014 ${a.headline}`
    )
    .join('     \u2502     ')

  return (
    <div
      className="ticker-bar py-2 relative"
      role="region"
      aria-label="Depeches urgentes"
      aria-live="off"
    >
      <div className="flex">
        <span className="ticker-content text-sm font-bold tracking-wide px-4">
          {tickerText}
          {'     \u2502     '}
          {tickerText}
        </span>
      </div>
    </div>
  )
}
