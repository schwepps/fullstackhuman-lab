import type { TypingProfile } from './types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function streamAtHumanPace(
  content: string,
  profile: TypingProfile,
  onTypingStart: () => void,
  onToken: (token: string) => void,
  onTypingEnd: () => void
): Promise<void> {
  // Thinking pause before typing starts
  const [minThink, maxThink] = profile.thinkingMs
  const thinkingPause = minThink + Math.random() * (maxThink - minThink)
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
