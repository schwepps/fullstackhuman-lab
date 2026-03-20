import 'server-only'
import { callClaude } from './claude-client'
import { EVIDENCE_MODEL, EVIDENCE_TYPE_LABELS } from './constants'
import type { EvidenceType } from './types'
import type { AISkill } from './techniques'

const MAX_EVIDENCE_TOKENS = 512

const EVIDENCE_FORMAT_INSTRUCTIONS: Record<EvidenceType, string> = {
  slack: `Generate a realistic Teams/Slack message. Include:
- Channel or DM context (e.g., "#general" or "Direct Message")
- Sender name and avatar emoji
- Message text with realistic formatting
- 1-2 emoji reactions from other members`,

  linkedin: `Generate a realistic LinkedIn post. Include:
- Author name, title, and company
- Post text with corporate buzzwords
- Hashtags
- Engagement metrics (likes, comments)
- One or two realistic comments`,

  email: `Generate a realistic email chain. Include:
- From, To, CC fields with names
- Subject line
- Email body with formal/informal tone
- Optional reply or forward`,

  meeting: `Generate realistic meeting transcript notes. Include:
- Meeting title and date
- Attendees list
- Key discussion points
- Action items assigned to specific people
- One notable quote`,

  expense: `Generate a suspicious expense report. Include:
- Line items in a table format (Date | Description | Amount)
- 3-5 expense entries
- Total amount
- A "FLAGGED" or "UNDER REVIEW" marker
- Approver name`,
}

/** Generate fake evidence using Claude Haiku */
export async function generateEvidence(
  prompt: string,
  evidenceType: EvidenceType,
  suspectName: string,
  crimeText: string,
  skill: AISkill,
  onToken?: (token: string) => void
): Promise<string> {
  const formatLabel = EVIDENCE_TYPE_LABELS[evidenceType]
  const formatInstructions = EVIDENCE_FORMAT_INSTRUCTIONS[evidenceType]

  const systemPrompt = `You are the evidence fabrication department of Jailnabi, a humorous game.

Your job: Generate a FAKE but realistic-looking ${formatLabel} that serves as evidence that the suspect committed the crime.

${formatInstructions}

Rules:
- The evidence must be FUNNY and ABSURD but formatted realistically
- Use the suspect's actual name in the evidence
- Reference the specific crime naturally
- Keep it under 200 words
- Make it look like a real ${formatLabel.toLowerCase()} at first glance
- Use the suspect's name: "${suspectName}"
- The crime: "${crimeText}"
- Today's AI skill tip for the player was: "${skill.name}" — "${skill.tip}"

Output ONLY the fake ${formatLabel.toLowerCase()} content. No meta-commentary.`

  const userMessage = `Player's prompt (${prompt.split(/\s+/).length} words): "${prompt}"

Generate the fake ${formatLabel.toLowerCase()} evidence based on this prompt.`

  return callClaude(
    EVIDENCE_MODEL,
    systemPrompt,
    userMessage,
    MAX_EVIDENCE_TOKENS,
    onToken
  )
}

/** Generate a weak default alibi when the accused doesn't defend in time */
export async function generateDefaultAlibi(
  suspectName: string,
  crimeText: string
): Promise<string> {
  const systemPrompt = `You are generating a weak, unconvincing alibi for someone who didn't bother to defend themselves in the Jailnabi game.

Make it sound like a hastily written, generic denial that clearly won't convince anyone. Keep it to 2-3 sentences. Be funny.`

  const userMessage = `${suspectName} is accused of: "${crimeText}"

They didn't show up to defend themselves. Generate their auto-alibi.`

  return callClaude(EVIDENCE_MODEL, systemPrompt, userMessage, 150)
}
