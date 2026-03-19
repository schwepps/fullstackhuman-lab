import Image from 'next/image'
import type { Article, ArticleImage } from '@/lib/types'
import { IMAGES, MINISTRIES } from '@/lib/constants'

const IMAGE_MAP: Record<ArticleImage, string> = {
  tech: IMAGES.tech,
  economy: IMAGES.economy,
  international: IMAGES.international,
}

export function ArticleCard({
  article,
  index,
}: {
  article: Article
  index: number
}) {
  const ministry = MINISTRIES[article.ministry]
  const imageSrc = article.image ? IMAGE_MAP[article.image] : null

  return (
    <article
      className="article-card flex flex-col animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms`, opacity: 0 }}
    >
      {/* Image */}
      {imageSrc && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-surface to-transparent opacity-60" />
        </div>
      )}

      <div className="flex flex-col flex-1 p-4">
        {/* Ministry + urgency badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {article.urgency !== 'normal' && (
            <span className="badge-urgent text-[10px] px-1.5 py-0.5">
              {article.urgency === 'breaking' ? 'URGENT' : 'FLASH'}
            </span>
          )}
          <span className="badge-ministry text-[10px]">{ministry.label}</span>
        </div>

        {/* Headline */}
        <h3
          className="text-base sm:text-lg font-bold leading-snug text-foreground mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {article.headline}
        </h3>

        {/* Summary */}
        <p className="text-sm text-foreground/70 leading-relaxed flex-1">
          {article.summary}
        </p>

        {/* Timestamp + stamp */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <time
            className="text-[10px] text-muted uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-heading)' }}
            dateTime={article.publishedAt}
          >
            {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
          <span className="text-[10px] text-primary/60 uppercase tracking-wider font-bold">
            ★ Approuve
          </span>
        </div>
      </div>
    </article>
  )
}
