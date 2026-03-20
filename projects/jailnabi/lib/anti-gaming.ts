import { countWords, getWords, normalizeInput } from './word-counter'
import {
  MIN_PROMPT_WORDS,
  MAX_PROMPT_WORDS,
  MAX_PROMPT_LENGTH,
  MIN_WORD_VARIETY_RATIO,
} from './constants'
import type { ValidationResult } from './types'

/**
 * Prompt validation for Jailnabi.
 *
 * Lighter than Prompt Golf — no code injection checks needed since
 * players write natural language prompts to generate evidence, not code.
 * Main defense: word count limit (25 words max).
 */

export function validatePrompt(prompt: string): ValidationResult {
  const trimmed = normalizeInput(prompt)

  if (trimmed.length === 0) {
    return { isValid: false, wordCount: 0, reason: 'Prompt is empty.' }
  }

  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return {
      isValid: false,
      wordCount: 0,
      reason: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters.`,
    }
  }

  const wordCount = countWords(trimmed)

  if (wordCount < MIN_PROMPT_WORDS) {
    return {
      isValid: false,
      wordCount,
      reason: `Need at least ${MIN_PROMPT_WORDS} words. You have ${wordCount}.`,
    }
  }

  if (wordCount > MAX_PROMPT_WORDS) {
    return {
      isValid: false,
      wordCount,
      reason: `Maximum ${MAX_PROMPT_WORDS} words. You have ${wordCount}.`,
    }
  }

  // Check word variety — reject if < 30% unique words
  const words = getWords(trimmed).map((w) => w.toLowerCase())
  if (words.length > 2) {
    const unique = new Set(words)
    if (unique.size / words.length < MIN_WORD_VARIETY_RATIO) {
      return {
        isValid: false,
        wordCount,
        reason: 'Too many repeated words. Try a more varied prompt.',
      }
    }
  }

  return { isValid: true, wordCount }
}
