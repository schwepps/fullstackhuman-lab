import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WEB_SEARCH_MAX_USES } from '@/lib/constants/chat'

describe('getTools', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns undefined when ANTHROPIC_ENABLE_WEB_SEARCH is not set', async () => {
    vi.stubEnv('ANTHROPIC_ENABLE_WEB_SEARCH', '')
    const { getTools } = await import('@/lib/ai/tools')
    expect(getTools()).toBeUndefined()
  })

  it('returns web search tool array when ANTHROPIC_ENABLE_WEB_SEARCH is true', async () => {
    vi.stubEnv('ANTHROPIC_ENABLE_WEB_SEARCH', 'true')
    const { getTools } = await import('@/lib/ai/tools')
    const tools = getTools()
    expect(tools).toHaveLength(1)
    expect(tools![0]).toMatchObject({
      type: 'web_search_20260209',
      name: 'web_search',
      max_uses: WEB_SEARCH_MAX_USES,
    })
  })

  it('returns undefined when ANTHROPIC_ENABLE_WEB_SEARCH is a truthy-but-wrong string', async () => {
    vi.stubEnv('ANTHROPIC_ENABLE_WEB_SEARCH', 'yes')
    const { getTools } = await import('@/lib/ai/tools')
    expect(getTools()).toBeUndefined()
  })

  it('returns undefined when ANTHROPIC_ENABLE_WEB_SEARCH is not defined', async () => {
    delete process.env.ANTHROPIC_ENABLE_WEB_SEARCH
    const { getTools } = await import('@/lib/ai/tools')
    expect(getTools()).toBeUndefined()
  })
})
