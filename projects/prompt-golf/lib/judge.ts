import 'server-only'
import { callClaude } from './claude-client'
import { JUDGE_MODEL } from './constants'
import type { CodeChallenge, JudgeTestResult } from './types'

const MAX_JUDGE_TOKENS = 2048

export interface JudgeVerdict {
  pass: boolean
  testResults: JudgeTestResult[]
  summary: string
}

// ── Layer 1: Structural checks (deterministic, fast) ─────────────

export function runStructuralChecks(
  code: string,
  challenge: CodeChallenge
): { pass: boolean; reason?: string } {
  // Extract function name from signature
  const fnNameMatch = challenge.functionSignature.match(/function\s+(\w+)/)
  if (!fnNameMatch) return { pass: true }
  const expectedName = fnNameMatch[1]

  // Check function name exists
  if (!code.includes(expectedName)) {
    return {
      pass: false,
      reason: `Missing function "${expectedName}". The code does not contain the required function.`,
    }
  }

  // Check for return statement (unless void)
  const isVoid = challenge.functionSignature.includes(': void')
  if (!isVoid && !code.includes('return')) {
    return {
      pass: false,
      reason: `Function "${expectedName}" has no return statement.`,
    }
  }

  // Check balanced braces
  const opens = (code.match(/{/g) ?? []).length
  const closes = (code.match(/}/g) ?? []).length
  if (opens !== closes) {
    return {
      pass: false,
      reason: 'Code has unbalanced braces — likely a syntax error.',
    }
  }

  return { pass: true }
}

// ── Layer 2: Semantic evaluation (Claude Sonnet) ─────────────────

export async function judgeCode(
  challenge: CodeChallenge,
  generatedCode: string,
  onToken?: (token: string) => void
): Promise<JudgeVerdict> {
  // Run structural checks first
  const structural = runStructuralChecks(generatedCode, challenge)
  if (!structural.pass) {
    return {
      pass: false,
      testResults: [
        {
          case: 'Structural check',
          pass: false,
          reasoning: structural.reason ?? 'Failed structural validation',
        },
      ],
      summary: structural.reason ?? 'Failed structural validation',
    }
  }

  // Run semantic evaluation
  const allTestCases = [...challenge.testCases, ...challenge.edgeCases]

  const systemPrompt = `You are a TypeScript code judge for a game called Prompt Golf.
Your job is to evaluate whether a given function implementation is correct.

## Evaluation Protocol

For EACH test case, perform these steps:
1. Mentally trace the execution with the given input
2. Determine the actual output
3. Compare with the expected output
4. Record PASS or FAIL with brief reasoning

After evaluating all test cases:
- If ALL test cases pass: verdict is PASS
- If ANY test case fails: verdict is FAIL

## Critical Rules

- Evaluate CORRECTNESS, not code style or efficiency.
- A function that produces the right output for all test cases PASSES, even if unusual.
- A function that fails even ONE test case FAILS, even if elegant.
- If the code has syntax errors that would prevent execution, it FAILS.
- If the function signature does not match (wrong name, wrong params), it FAILS.
- An empty function body FAILS (unless expected output is undefined for all cases).

## Output Format

Output your analysis, then wrap your final verdict in <verdict> tags as JSON:

<verdict>
{"pass": true_or_false, "testResults": [{"case": "description", "pass": true_or_false, "reasoning": "brief trace"}], "summary": "one-sentence assessment"}
</verdict>

Think through each test case step by step. Be fair but strict.`

  const userMessage = `## Function Signature
${challenge.functionSignature}

## Generated Code
\`\`\`typescript
${generatedCode}
\`\`\`

## Test Cases
${allTestCases.map((tc, i) => `${i + 1}. ${tc.description}: ${JSON.stringify(tc.input)} → ${JSON.stringify(tc.expected)}`).join('\n')}`

  const response = await callClaude(
    JUDGE_MODEL,
    systemPrompt,
    userMessage,
    MAX_JUDGE_TOKENS,
    onToken
  )

  return parseJudgeVerdict(response)
}

function parseJudgeVerdict(response: string): JudgeVerdict {
  const verdictMatch = response.match(/<verdict>\s*([\s\S]*?)\s*<\/verdict>/)

  if (!verdictMatch) {
    console.warn('[judge] No <verdict> tags found in response')
    return {
      pass: false,
      testResults: [
        {
          case: 'Parse error',
          pass: false,
          reasoning: 'Judge response did not contain a parseable verdict.',
        },
      ],
      summary: 'Could not parse judge verdict. Treating as fail.',
    }
  }

  try {
    const parsed = JSON.parse(verdictMatch[1])
    return {
      pass: Boolean(parsed.pass),
      testResults: Array.isArray(parsed.testResults)
        ? parsed.testResults.map(
            (tr: { case?: string; pass?: boolean; reasoning?: string }) => ({
              case: String(tr.case ?? ''),
              pass: Boolean(tr.pass),
              reasoning: String(tr.reasoning ?? ''),
            })
          )
        : [],
      summary: String(parsed.summary ?? ''),
    }
  } catch {
    console.warn('[judge] Failed to parse verdict JSON')
    return {
      pass: false,
      testResults: [
        {
          case: 'Parse error',
          pass: false,
          reasoning: 'Verdict JSON was malformed.',
        },
      ],
      summary: 'Judge produced malformed verdict. Treating as fail.',
    }
  }
}
