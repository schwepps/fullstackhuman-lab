import 'server-only'
import { callClaude } from './claude-client'
import { GENERATOR_MODEL } from './constants'
import type { CodeChallenge } from './types'

const MAX_OUTPUT_TOKENS = 1024

/**
 * Generate TypeScript code from a natural language prompt.
 *
 * Uses Claude Haiku for fast, cheap code generation.
 * The system prompt constrains output to a single function
 * matching the challenge's signature.
 */
export async function generateCode(
  challenge: CodeChallenge,
  playerPrompt: string,
  onToken?: (token: string) => void
): Promise<string> {
  const systemPrompt = buildGeneratorPrompt(challenge)

  const userMessage = `The player's description:\n${playerPrompt}`

  return callClaude(
    GENERATOR_MODEL,
    systemPrompt,
    userMessage,
    MAX_OUTPUT_TOKENS,
    onToken
  )
}

function buildGeneratorPrompt(challenge: CodeChallenge): string {
  return `You are a TypeScript code generator for a game called Prompt Golf.

The player describes what code to write in natural language — often very briefly.
Your job: output a SINGLE TypeScript function that matches the required signature.

## Required Function Signature
${challenge.functionSignature}

## What The Function Should Do
${challenge.description}

## Rules
- Output ONLY the function. No imports, no exports, no comments, no explanation.
- The function must be self-contained (no external dependencies).
- Follow the EXACT function name and parameter types from the signature.
- If the player's description is vague or incomplete, write your best interpretation.
- Do NOT add extra features, error handling, or edge cases beyond what was asked.
- Keep it concise — the simplest correct implementation wins.

## Important
The player's description may be extremely short (2-5 words). This is intentional.
Interpret it generously — if "memoize" is the entire prompt, write a memoization function.
Common programming terms carry their standard meaning.`
}
