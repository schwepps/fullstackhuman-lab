import type { CodeChallenge } from '@/lib/types'

export const hole4: CodeChallenge = {
  id: 'debounce',
  type: 'code',
  course: 'front-9',
  holeNumber: 4,
  name: 'The Fairway',
  description:
    'Write a debounce function that delays invoking a callback until after a specified number of milliseconds have elapsed since the last invocation.',
  par: 6,
  principle: 'Domain vocabulary compresses intent',
  functionSignature:
    'function debounce<T extends (...args: unknown[]) => void>(fn: T, delayMs: number): (...args: Parameters<T>) => void',
  testCases: [
    {
      input: [],
      expected: 'BEHAVIOR_TEST',
      description: 'Returns a function that delays invocation',
    },
  ],
  edgeCases: [
    {
      input: [],
      expected: 'BEHAVIOR_TEST',
      description: 'Subsequent calls reset the timer',
    },
  ],
  hints: [
    'There is a single word that describes this entire pattern.',
    'Think about what "debounce" means in programming.',
    'Try: "debounce function with delay"',
  ],
  analyzerContext: `Common compression traps:
- "debounce" alone (1 word) is below the 2-word minimum but nearly sufficient
- "debounce function" (2 words) almost always produces correct code
- "delay function call until idle" (5 words) works but costs more
- "wait for typing to stop" (5 words) describes behavior but is less precise
- Players who don't know the term "debounce" face a HUGE word count penalty

Key insight to surface: Domain-specific vocabulary (debounce, throttle, memoize)
compresses INTENT, not just description. "Debounce" replaces an entire paragraph
about "delaying execution until a pause in rapid calls." Research shows 57% of
successful prompt optimizations use domain-specific terms (Mao et al. 2025).
If you don't know the jargon, you pay in word count.`,
}
