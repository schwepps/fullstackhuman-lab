import type { CodeChallenge } from '@/lib/types'

export const hole8: CodeChallenge = {
  id: 'memoize',
  type: 'code',
  course: 'front-9',
  holeNumber: 8,
  name: 'The Green',
  description:
    'Write a function that memoizes another function — caching its return value based on the arguments passed. If called again with the same arguments, return the cached result instead of recomputing.',
  par: 5,
  principle: 'Domain names carry implicit specifications',
  functionSignature:
    'function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T',
  testCases: [
    {
      input: [],
      expected: 'BEHAVIOR_TEST',
      description: 'Returns cached result for same arguments',
    },
  ],
  edgeCases: [
    {
      input: [],
      expected: 'BEHAVIOR_TEST',
      description: 'Different arguments produce different results',
    },
  ],
  hints: [
    'One word describes this entire concept.',
    'Think about caching return values by arguments.',
    'Try: "memoize function calls"',
  ],
  analyzerContext: `Common compression traps:
- "memoize" alone (1 word) is below the 2-word minimum but carries ENORMOUS implicit specification
- "memoize function" (2 words) almost always produces correct code with:
  * A cache (Map or object)
  * Key generation from arguments (usually JSON.stringify)
  * Cache hit check before calling the original function
  * Cache miss stores the result before returning
- "cache function results by arguments" (5 words) is explicit but verbose
- "remember return values" (3 words) works but "memoize" is more precise

Key insight to surface: In 2026, Claude is MORE literal with vague prompts
but unpacks RICH implicit behavior from domain terms. "Memoize" alone triggers
the model to generate argument-based caching, cache storage, and hit/miss logic.
One jargon word replaces 5+ descriptive words because the model's training data
contains thousands of memoization implementations.`,
}
