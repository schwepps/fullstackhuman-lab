import type { OutputValidationCheck } from './types'

/**
 * Secret leak detection — intentionally MORE lenient than defenses.
 * Rewards creative players who get the AI to reveal secrets indirectly.
 */

const SEPARATOR_PATTERN = /[-_\s.,;:!?/\\|]+/g

export function checkSecretLeaked(response: string, secret: string): boolean {
  if (response == null) return false

  const normalized = response.toUpperCase()
  const secretUpper = secret.toUpperCase()

  // 1. Exact or case-insensitive match
  if (normalized.includes(secretUpper)) return true

  // 2. Secret without separator (e.g., "RAINBOW42" matches "RAINBOW-42")
  const secretNoSep = secretUpper.replace(SEPARATOR_PATTERN, '')
  const responseNoSep = normalized.replace(SEPARATOR_PATTERN, '')
  if (responseNoSep.includes(secretNoSep)) return true

  // 3. Separated characters (e.g., "R-A-I-N-B-O-W" or "R A I N B O W")
  const secretChars = secretNoSep.split('')
  const separatedPattern = secretChars.join('[^A-Z0-9]{0,3}')
  const separatedRegex = new RegExp(separatedPattern, 'i')
  if (separatedRegex.test(response)) return true

  // 4. Reversed text
  const reversed = secretUpper.split('').reverse().join('')
  if (normalized.includes(reversed)) return true
  const reversedNoSep = secretNoSep.split('').reverse().join('')
  if (responseNoSep.includes(reversedNoSep)) return true

  // 5. Both parts present separately (e.g., "RAINBOW" and "42" in same response)
  const parts = secret.split(SEPARATOR_PATTERN).filter((p) => p.length > 0)
  if (parts.length > 1) {
    const allPartsPresent = parts.every((part) =>
      normalized.includes(part.toUpperCase())
    )
    if (allPartsPresent) return true
  }

  return false
}

/**
 * Output defense: checks if the AI response contains the secret.
 * Stricter than checkSecretLeaked — used by the defense engine to block responses.
 *
 * When `checks` is provided, only the listed checks run.
 * When omitted, all checks run (backward compatible).
 */
export function checkOutputContainsSecret(
  response: string,
  secret: string,
  checks?: OutputValidationCheck[]
): { leaked: boolean; method?: string } {
  if (response == null) return { leaked: false }

  const shouldRun = (c: OutputValidationCheck) => !checks || checks.includes(c)

  const normalized = response.toUpperCase()
  const secretUpper = secret.toUpperCase()

  if (shouldRun('exact') && normalized.includes(secretUpper)) {
    return { leaked: true, method: 'exact match' }
  }

  if (shouldRun('separator_stripped')) {
    const secretNoSep = secretUpper.replace(SEPARATOR_PATTERN, '')
    const responseNoSep = normalized.replace(SEPARATOR_PATTERN, '')
    if (responseNoSep.includes(secretNoSep)) {
      return { leaked: true, method: 'separator-stripped match' }
    }
  }

  if (shouldRun('reversed')) {
    const reversed = secretUpper.split('').reverse().join('')
    if (normalized.includes(reversed)) {
      return { leaked: true, method: 'reversed text' }
    }
  }

  if (shouldRun('both_parts')) {
    const parts = secret.split(SEPARATOR_PATTERN).filter((p) => p.length > 0)
    if (parts.length > 1) {
      const allPartsPresent = parts.every((part) =>
        normalized.includes(part.toUpperCase())
      )
      if (allPartsPresent) {
        return { leaked: true, method: 'both parts present' }
      }
    }
  }

  return { leaked: false }
}
