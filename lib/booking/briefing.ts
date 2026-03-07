import { getAnthropicClient } from '@/lib/ai/client'
import { getBookingWithContext } from './admin-queries'
import { updateBookingBriefing } from './admin-queries'
import { log } from '@/lib/logger'

const BRIEFING_PROMPT = `You are preparing a pre-meeting briefing for François Schuers, a product & tech consultant.

Analyze the conversation below and generate a briefing in this format:

## Key Points (3-5 bullets)
- [Most important takeaway]
- [Core problem identified]
- [Key context/constraints]

## Core Problem
[One paragraph describing the central issue]

## Pain Points & Red Flags
- [Specific pain point or concern]
- [Another if applicable]

## Suggested Focus Areas
- [What François should explore in the meeting]

Keep it under 300 words. Be specific, not generic. Use the person's actual context.`

export async function generateBriefing(bookingId: string): Promise<boolean> {
  const context = await getBookingWithContext(bookingId)
  if (!context) return false

  const messages = context.conversationMessages as Array<{
    role: string
    content: string
  }>
  if (messages.length === 0) return false

  const conversationText = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n\n')

  try {
    const client = getAnthropicClient()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `${BRIEFING_PROMPT}\n\n---\n\n${conversationText}`,
        },
      ],
    })

    const briefing = response.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('')

    if (briefing) {
      return await updateBookingBriefing(bookingId, briefing)
    }
    return false
  } catch (error) {
    log('error', 'briefing_generation_failed', {
      bookingId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
