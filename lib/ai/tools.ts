import type { WebSearchTool20260209 } from '@anthropic-ai/sdk/resources/messages/messages'
import { WEB_SEARCH_MAX_USES } from '@/lib/constants/chat'

const WEB_SEARCH_TOOL: WebSearchTool20260209 = {
  name: 'web_search',
  type: 'web_search_20260209',
  max_uses: WEB_SEARCH_MAX_USES,
}

export function getTools(): WebSearchTool20260209[] | undefined {
  if (process.env.ANTHROPIC_ENABLE_WEB_SEARCH !== 'true') return undefined
  return [WEB_SEARCH_TOOL]
}
