import { countWords, getWords } from './word-counter'
import {
  MIN_PROMPT_WORDS,
  MAX_PROMPT_WORDS,
  MAX_PROMPT_LENGTH,
} from './constants'
import type { ValidationResult } from './types'

/**
 * Light-touch anti-gaming validation.
 *
 * The word counter regex is the primary defense — code syntax is
 * inherently expensive in word count. These checks catch only
 * blatant code injection patterns.
 */

const BLATANT_CODE_PATTERNS = [
  /=>/, // Arrow functions
  /function\s*\(/, // Function declarations
  /\w\.\w+\(/, // Method calls: arr.map(
  /\$\{/, // Template literal interpolation
  /(?:const|let|var)\s+\w+\s*=/, // Variable declarations
]

export function validatePrompt(prompt: string): ValidationResult {
  const trimmed = prompt.trim()

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

  for (const pattern of BLATANT_CODE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        wordCount,
        reason:
          'This looks like code, not a natural language description. Describe what you want, not how to implement it.',
      }
    }
  }

  // Check word variety — reject if < 30% unique words (catches repetition exploits)
  const words = getWords(trimmed).map((w) => w.toLowerCase())
  if (words.length > 2) {
    const unique = new Set(words)
    if (unique.size / words.length < 0.3) {
      return {
        isValid: false,
        wordCount,
        reason:
          'Too many repeated words. Try describing your intent more clearly.',
      }
    }
  }

  return { isValid: true, wordCount }
}
