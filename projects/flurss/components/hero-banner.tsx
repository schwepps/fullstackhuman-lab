import Image from 'next/image'
import type { Article } from '@/lib/types'
import { IMAGES, MINISTRIES } from '@/lib/constants'

export function HeroBanner({ article }: { article: Article }) {
  const ministry = MINISTRIES[article.ministry]

  return (
    <article className="relative overflow-hidden">
      {/* Hero image */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9]">
        <Image
          src={IMAGES.hero}
          alt="FlURSS — Information, arme du proletariat"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 800px"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="relative -mt-24 sm:-mt-32 px-4 sm:px-6 pb-6">
        <div className="flex items-center gap-3 mb-3">
          {article.urgency !== 'normal' && (
            <span className="badge-urgent">
              {article.urgency === 'breaking'
                ? '\u26A0 URGENT'
                : '\u26A1 FLASH'}
            </span>
          )}
          <span className="badge-ministry">{ministry.label}</span>
        </div>

        <h2
          className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-foreground mb-3"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {article.headline}
        </h2>

        <p className="text-base sm:text-lg text-foreground/80 leading-relaxed max-w-3xl">
          {article.summary}
        </p>

        <time
          className="block mt-3 text-xs text-muted uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-heading)' }}
          dateTime={article.publishedAt}
        >
          {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {' \u2014 An 3 de la Revolution Numerique'}
        </time>
      </div>
    </article>
  )
}
