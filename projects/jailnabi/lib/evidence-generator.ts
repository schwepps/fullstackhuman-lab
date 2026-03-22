import 'server-only'
import { callClaude } from './claude-client'
import { EVIDENCE_MODEL } from './constants'
import type { AISkill } from './types'

const MAX_EVIDENCE_TOKENS = 512

/**
 * Generate fake evidence/defense content from a player's prompt.
 * The prompt is dual-purpose: defend AND/OR accuse in one message.
 */
export async function generateContent(
  prompt: string,
  playerName: string,
  crime: string,
  skill: AISkill,
  context: {
    targetName: string | null
    isDefense: boolean
    accusedName: string
  },
  onToken?: (token: string) => void
): Promise<string> {
  const actionType = context.isDefense
    ? context.targetName
      ? `defending themselves AND accusing ${context.targetName}`
      : 'defending themselves'
    : context.targetName
      ? `accusing ${context.targetName}`
      : 'making a general accusation'

  const systemPrompt = `You are the evidence fabrication department of Jailnabi, a humorous party game.

A crime has been committed: "${crime}"
The initially accused person is: ${context.accusedName}
Player "${playerName}" is ${actionType}.

Your job: Generate FAKE but realistic-looking evidence based on the player's prompt. This could be:
- A fake Slack/Teams message with emoji reactions
- A fake LinkedIn post with corporate cringe
- A fake email chain with CC chaos
- A fake meeting transcript with attendees
- A fake expense report with suspicious amounts
- Or any creative format that fits the prompt

Rules:
- Be FUNNY and ABSURD but format realistically
- Reference specific names and the crime naturally
- Keep it under 200 words
- Make it look like a real document at first glance
- The player's AI skill tip is: "${skill.name}" — "${skill.tip}"

Output ONLY the fake evidence content. No meta-commentary.`

  const userMessage = `Player "${playerName}" wrote (${prompt.split(/\s+/).length} words): "${prompt}"

Generate the fake evidence.`

  return callClaude(
    EVIDENCE_MODEL,
    systemPrompt,
    userMessage,
    MAX_EVIDENCE_TOKENS,
    onToken
  )
}
