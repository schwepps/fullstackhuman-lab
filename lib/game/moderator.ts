import Anthropic from '@anthropic-ai/sdk'
import { MAX_MESSAGE_LENGTH } from './constants'

const anthropic = new Anthropic()
const SAFE_SHORT_PATTERN = /^[\w\s.,!?'"()-]+$/

const MODERATION_SYSTEM = `You are a chat moderator for a social deduction game where players try to identify AI impostors.
Respond with exactly one word: SAFE or BLOCK.

BLOCK only: slurs, hate speech, explicit sexual content, threats of violence, doxxing/personal info, spam/gibberish.
DO NOT BLOCK: rudeness, sarcasm, profanity, accusations of being AI (that IS the game), strong opinions, competitive trash talk.`

export async function moderateMessage(
  content: string,
  _playerId: string
): Promise<{ safe: boolean; reason?: string }> {
  if (content.trim().length === 0) {
    return { safe: false, reason: 'empty' }
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return { safe: false, reason: 'too_long' }
  }

  // Fast path: short simple messages
  if (content.length < 20 && SAFE_SHORT_PATTERN.test(content)) {
    return { safe: true }
  }

  // AI moderation
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      system: MODERATION_SYSTEM,
      messages: [{ role: 'user', content }],
    })

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : ''
    const isSafe = text.trim().toUpperCase().startsWith('SAFE')

    return isSafe ? { safe: true } : { safe: false, reason: 'moderated' }
  } catch {
    // Fail closed — if moderation service is down, block the message
    return { safe: false, reason: 'moderation_unavailable' }
  }
}
