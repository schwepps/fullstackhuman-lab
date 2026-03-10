import type { TypingProfile } from './types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Log-normal random: most values cluster near the median,
 * with occasional longer pauses — matches human response patterns.
 */
export function logNormalRandom(median: number, sigma = 0.4): number {
  // Box-Muller transform for normal random
  const u1 = Math.random() || 1e-10 // avoid log(0)
  const u2 = Math.random()
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return median * Math.exp(sigma * normal)
}

export async function streamAtHumanPace(
  content: string,
  profile: TypingProfile,
  onTypingStart: () => void,
  onToken: (token: string) => void,
  onTypingEnd: () => void
): Promise<void> {
  const thinkingPause = calculateThinkingDuration(profile)
  await delay(thinkingPause)

  onTypingStart()

  // Base ms per character: 60000ms/min ÷ (wpm × 5 chars/word)
  const baseMs = 60_000 / (profile.wpm * 5)

  for (const char of content) {
    // Natural variance per character type
    const isPunctuation = '.!?,;:'.includes(char)
    const variance = isPunctuation
      ? 0.8 + Math.random() * 1.4 // 0.8–2.2x for punctuation
      : 0.6 + Math.random() * 0.8 // 0.6–1.4x for normal chars

    await delay(baseMs * variance)
    onToken(char)
  }

  onTypingEnd()
}

/**
 * Calculate thinking pause duration (before typing indicator shows).
 */
export function calculateThinkingDuration(profile: TypingProfile): number {
  const [minThink, maxThink] = profile.thinkingMs
  const median = (minThink + maxThink) / 2
  return Math.max(minThink, Math.min(maxThink * 1.5, logNormalRandom(median)))
}

/**
 * Calculate typing-only duration for a message (how long dots show).
 * Does NOT include thinking pause — that's separate.
 */
export function calculateTypingDuration(
  content: string,
  profile: TypingProfile
): number {
  const baseMs = 60_000 / (profile.wpm * 5)
  const avgVariance = 1.025
  return content.length * baseMs * avgVariance
}
