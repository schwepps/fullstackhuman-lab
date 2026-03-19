import { Logo } from '@/components/logo'
import { BreakingTicker } from '@/components/breaking-ticker'
import { HeroBanner } from '@/components/hero-banner'
import { ArticleGrid } from '@/components/article-grid'
import { StateAnnouncements } from '@/components/state-announcements'
import { AnthemPlayer } from '@/components/anthem-player'
import { Footer } from '@/components/footer'
import {
  getBreakingArticles,
  getHeroArticle,
  getGridArticles,
} from '@/lib/articles'

export default function HomePage() {
  const breakingArticles = getBreakingArticles()
  const heroArticle = getHeroArticle()
  const gridArticles = getGridArticles()

  return (
    <>
      {/* Breaking news ticker */}
      <BreakingTicker articles={breakingArticles} />

      {/* Logo */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Logo className="max-w-md mx-auto sm:mx-0" />
      </div>

      <div className="gold-line" />

      {/* Main content: hero + grid + sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-8">
          {/* Main column */}
          <div className="space-y-8">
            <HeroBanner article={heroArticle} />
            <div className="gold-line" />
            <ArticleGrid articles={gridArticles} />
          </div>

          {/* Sidebar — hidden on mobile, visible on lg */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <StateAnnouncements />
            </div>
          </div>
        </div>

        {/* Mobile sidebar: show below articles */}
        <div className="lg:hidden mt-8">
          <StateAnnouncements />
        </div>
      </div>

      <div className="gold-line" />

      {/* Anthem player */}
      <AnthemPlayer />

      {/* Footer */}
      <Footer />
    </>
  )
}
