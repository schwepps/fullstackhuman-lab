import 'server-only'
import { callClaude } from './claude-client'
import { ANALYZER_MODEL } from './constants'
import type { CodeChallenge } from './types'

const MAX_ANALYZER_TOKENS = 768

export interface SwingAnalysis {
  summary: string
  detail: string
  optimalPrompt: string | null
  concept: string | null
}

/**
 * Produce an educational swing analysis explaining why the prompt
 * worked or failed, which words were load-bearing, and how to
 * compress further.
 *
 * On pass: includes optimalPrompt and concept explanation.
 * On fail/practice: optimalPrompt and concept are null (no spoilers).
 */
export async function analyzeSwing(
  challenge: CodeChallenge,
  playerPrompt: string,
  generatedCode: string,
  verdict: 'pass' | 'fail' | 'practice',
  wordCount: number
): Promise<SwingAnalysis> {
  const systemPrompt = buildAnalyzerPrompt(challenge, verdict)

  const userMessage = `Player's prompt: "${playerPrompt}"
Word count: ${wordCount} (target: ${challenge.par})

Generated code:
\`\`\`typescript
${generatedCode}
\`\`\`

Result: ${verdict === 'pass' ? 'PASSED' : verdict === 'fail' ? 'FAILED' : 'PRACTICE (not judged)'}`

  const response = await callClaude(
    ANALYZER_MODEL,
    systemPrompt,
    userMessage,
    MAX_ANALYZER_TOKENS
  )

  return parseAnalysis(response, verdict)
}

function buildAnalyzerPrompt(
  challenge: CodeChallenge,
  verdict: 'pass' | 'fail' | 'practice'
): string {
  const base = `You are the swing analyzer for Prompt Golf — a game where players describe code in as few words as possible.

## Challenge
Function: ${challenge.functionSignature}
Description: ${challenge.description}
Principle being taught: ${challenge.principle}

## Challenge-Specific Knowledge
${challenge.analyzerContext}

## Important
The word count is provided in the user message. ALWAYS use the provided word count — do NOT count words yourself. Your counting will be wrong.

## Your Task
Analyze the player's prompt and the code it generated.

## Output Format
Wrap your output in <analysis> tags as JSON:
<analysis>
{
  "summary": "...",
  "detail": "..."${verdict === 'pass' ? ',\n  "optimalPrompt": "...",\n  "concept": "..."' : ''}
}
</analysis>`

  if (verdict === 'pass') {
    return `${base}

## For PASSING attempts, produce these fields:
- **summary**: "Load-bearing: [key words]. Filler: [removable words]. Tip: [compression tip]." (max 100 chars)
- **detail**: 2-3 paragraphs explaining which words were essential vs removable, what the AI inferred implicitly, and how a pro might compress further.
- **optimalPrompt**: The shortest natural language prompt (2-5 words) that would produce correct code for this challenge. Be specific and realistic — this must actually work.
- **concept**: ONE sentence (max 30 words) explaining WHY the optimal prompt works. Be punchy and concrete. Connect to: "${challenge.principle}". Example: "AI models know 'chunk' as a named pattern — the name alone is the full specification."

The optimalPrompt and concept are the main learning payoff — make them concrete and insightful.`
  }

  if (verdict === 'practice') {
    return `${base}

## For PRACTICE swings (code was NOT judged):
- **summary**: "Interesting approach. [observation about word choice]. Try scoring to see if it passes."
- **detail**: Comment on the player's strategy — which words seem promising, what to refine. Do NOT reveal the optimal prompt. Do NOT claim correctness.

Do NOT include optimalPrompt or concept fields — the player hasn't earned them yet.`
  }

  return `${base}

## For FAILING attempts:
- **summary**: "Misread: [what went wrong]. Try: [specific rephrasing direction]." (max 100 chars)
- **detail**: Explain what the AI misunderstood and why, which word(s) led it astray, and a concrete direction to try.

Do NOT include optimalPrompt or concept fields — the player hasn't earned them yet. Give directional hints without revealing the answer.`
}

function parseAnalysis(
  response: string,
  verdict: 'pass' | 'fail' | 'practice'
): SwingAnalysis {
  const match = response.match(/<analysis>\s*([\s\S]*?)\s*<\/analysis>/)

  if (!match) {
    return {
      summary: 'Analysis unavailable.',
      detail: 'The analyzer could not produce a breakdown for this attempt.',
      optimalPrompt: null,
      concept: null,
    }
  }

  try {
    const parsed = JSON.parse(match[1])
    return {
      summary: String(parsed.summary ?? 'Analysis unavailable.'),
      detail: String(parsed.detail ?? ''),
      optimalPrompt:
        verdict === 'pass' && parsed.optimalPrompt
          ? String(parsed.optimalPrompt)
          : null,
      concept:
        verdict === 'pass' && parsed.concept ? String(parsed.concept) : null,
    }
  } catch {
    return {
      summary: 'Analysis unavailable.',
      detail: 'The analyzer produced a malformed response.',
      optimalPrompt: null,
      concept: null,
    }
  }
}
