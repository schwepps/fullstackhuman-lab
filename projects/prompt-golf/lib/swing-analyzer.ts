import 'server-only'
import { callClaude } from './claude-client'
import { ANALYZER_MODEL } from './constants'
import type { CodeChallenge } from './types'

const MAX_ANALYZER_TOKENS = 512

export interface SwingAnalysis {
  summary: string
  detail: string
}

/**
 * Produce an educational swing analysis explaining why the prompt
 * worked or failed, which words were load-bearing, and how to
 * compress further.
 *
 * Uses Claude Haiku for cost efficiency (~$0.0002 per call).
 */
export async function analyzeSwing(
  challenge: CodeChallenge,
  playerPrompt: string,
  generatedCode: string,
  passed: boolean
): Promise<SwingAnalysis> {
  const systemPrompt = buildAnalyzerPrompt(challenge, passed)

  const userMessage = `Player's prompt: "${playerPrompt}"

Generated code:
\`\`\`typescript
${generatedCode}
\`\`\`

Result: ${passed ? 'PASSED' : 'FAILED'}`

  const response = await callClaude(
    ANALYZER_MODEL,
    systemPrompt,
    userMessage,
    MAX_ANALYZER_TOKENS
  )

  return parseAnalysis(response)
}

function buildAnalyzerPrompt(
  challenge: CodeChallenge,
  passed: boolean
): string {
  const base = `You are the swing analyzer for Prompt Golf — a game where players describe code in as few words as possible.

## Challenge
Function: ${challenge.functionSignature}
Description: ${challenge.description}
Principle being taught: ${challenge.principle}

## Challenge-Specific Knowledge
${challenge.analyzerContext}

## Your Task
Analyze the player's prompt and the code it generated. Produce TWO outputs:

1. **summary**: A single-line summary (max 80 chars) shown by default.
2. **detail**: A 2-3 paragraph expanded analysis shown when the player clicks "expand."

## Output Format
Wrap your output in <analysis> tags as JSON:
<analysis>
{"summary": "...", "detail": "..."}
</analysis>`

  if (passed) {
    return `${base}

## For PASSING attempts:
- summary: "Load-bearing: [key words]. Filler: [removable words]. [compression tip]."
- detail: Explain which words were essential vs removable, what the AI inferred implicitly, and how a pro might compress further. Connect to the hole's learning principle: "${challenge.principle}".`
  }

  return `${base}

## For FAILING attempts:
- summary: "Misread: [what went wrong]. Try: [specific rephrasing]."
- detail: Explain what the AI misunderstood and why, which word(s) led it astray, and suggest a concrete rephrasing. Connect to the hole's learning principle: "${challenge.principle}".`
}

function parseAnalysis(response: string): SwingAnalysis {
  const match = response.match(/<analysis>\s*([\s\S]*?)\s*<\/analysis>/)

  if (!match) {
    return {
      summary: 'Analysis unavailable.',
      detail:
        'The swing analyzer could not produce a breakdown for this attempt.',
    }
  }

  try {
    const parsed = JSON.parse(match[1])
    return {
      summary: String(parsed.summary ?? 'Analysis unavailable.'),
      detail: String(parsed.detail ?? ''),
    }
  } catch {
    return {
      summary: 'Analysis unavailable.',
      detail: 'The swing analyzer produced a malformed response.',
    }
  }
}
