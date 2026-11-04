import 'server-only'
import { z } from 'zod'
import { callStructured, ModelRefusalError } from './claude-client'
import { JUDGE_CALL } from './constants'
import type { CodeChallenge } from './types'

export const JUDGE_VERDICT_SCHEMA = z.object({
  pass: z.boolean(),
  testResults: z.array(
    z.object({ case: z.string(), pass: z.boolean(), reasoning: z.string() })
  ),
  summary: z.string(),
})

export type JudgeVerdict = z.infer<typeof JUDGE_VERDICT_SCHEMA>

function failedVerdict(caseName: string, reason: string): JudgeVerdict {
  return {
    pass: false,
    testResults: [{ case: caseName, pass: false, reasoning: reason }],
    summary: reason,
  }
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
  generatedCode: string
): Promise<JudgeVerdict> {
  // Run structural checks first
  const structural = runStructuralChecks(generatedCode, challenge)
  if (!structural.pass) {
    return failedVerdict(
      'Structural check',
      structural.reason ?? 'Failed structural validation'
    )
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

## Behavioral Test Cases
Some test cases have expected value "BEHAVIOR_TEST". For these, evaluate the code BEHAVIORALLY based on the test description only. Do not compare output to the string "BEHAVIOR_TEST". Instead, reason about whether the code structure and logic would produce the described behavior (e.g., "Returns a function that delays invocation" — check if the code creates and returns a debounced wrapper function).

## Output

Return one testResults entry per test case, in order, with the case description and a brief trace as reasoning. Set pass to true only if every test case passes, and give a one-sentence summary.

Be fair but strict.`

  const userMessage = `## Function Signature
${challenge.functionSignature}

## Generated Code
\`\`\`typescript
${generatedCode}
\`\`\`

## Test Cases
${allTestCases.map((tc, i) => `${i + 1}. ${tc.description}: ${JSON.stringify(tc.input)} → ${JSON.stringify(tc.expected)}`).join('\n')}`

  try {
    return await callStructured(
      JUDGE_CALL,
      systemPrompt,
      userMessage,
      JUDGE_VERDICT_SCHEMA
    )
  } catch (error) {
    if (!(error instanceof ModelRefusalError)) throw error
    console.warn(`[judge] Judge declined (category: ${error.category})`)
    return failedVerdict(
      'Judge declined',
      'The judge declined to evaluate this code. Treating as fail.'
    )
  }
}
