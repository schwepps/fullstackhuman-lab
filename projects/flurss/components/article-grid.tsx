import type { Article } from '@/lib/types'
import { ArticleCard } from './article-card'

export function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <section>
      <div className="section-heading mb-4">
        <span>★ Dernieres depeches ★</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article, i) => (
          <ArticleCard key={article.id} article={article} index={i} />
        ))}
      </div>
    </section>
  )
}
