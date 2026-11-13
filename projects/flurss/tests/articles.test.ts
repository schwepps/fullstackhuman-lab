import { describe, it, expect } from 'vitest'
import {
  ARTICLES,
  getBreakingArticles,
  getGridArticles,
  getHeroArticle,
} from '@/lib/articles'
import { MINISTRIES } from '@/lib/constants'

describe('articles', () => {
  it('gives every article a unique id and a known ministry', () => {
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(ARTICLES.length)
    for (const article of ARTICLES) {
      expect(MINISTRIES[article.ministry]).toBeDefined()
    }
  })

  it('shows each article once: the hero, then the grid', () => {
    expect([getHeroArticle(), ...getGridArticles()]).toEqual(ARTICLES)
  })

  it('keeps normal articles out of the breaking ticker', () => {
    const breaking = getBreakingArticles()
    expect(breaking.length).toBeGreaterThan(0)
    expect(breaking.every((a) => a.urgency !== 'normal')).toBe(true)
  })
})
