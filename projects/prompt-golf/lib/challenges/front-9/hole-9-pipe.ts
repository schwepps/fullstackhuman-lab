import type { CodeChallenge } from '@/lib/types'

export const hole9: CodeChallenge = {
  id: 'pipe',
  type: 'code',
  course: 'front-9',
  holeNumber: 9,
  name: 'The 18th',
  description:
    'Write a pipe function that takes a value and a series of functions, and passes the value through each function in sequence, left to right. Each function receives the output of the previous one.',
  par: 6,
  principle: "Jargon unlocks patterns natural language can't compress",
  functionSignature:
    'function pipe<T>(value: T, ...fns: ((arg: unknown) => unknown)[]): unknown',
  testCases: [
    {
      input: [
        5,
        null, // fns are behavior-tested
      ],
      expected: 'BEHAVIOR_TEST',
      description: 'Chains functions left to right',
    },
  ],
  edgeCases: [
    {
      input: [42],
      expected: 42,
      description: 'No functions returns the value unchanged',
    },
  ],
  hints: [
    'There is a well-known functional programming term for this.',
    'Think: Unix pipes, or lodash flow.',
    'Try: "pipe value through functions"',
  ],
  analyzerContext: `Common compression traps:
- "pipe" (1 word, below minimum) is THE jargon term — instantly understood
- "pipe value through functions" (4 words) is clear and concise
- "chain functions left to right" (5 words) describes behavior without jargon
- "apply functions in sequence" (4 words) works but is less precise
- "compose left to right" or "flow" (3 words) are alternative jargon terms
- Without jargon, describing function composition requires many words:
  "pass value through first function, take result, pass to second function..."

Key insight to surface: Some programming patterns are fundamentally hard to
compress in natural language. Function composition, currying, monadic binding —
these concepts have precise jargon terms that unlock entire implementation
patterns. If you know the jargon ("pipe", "compose", "flow"), you get the
pattern in 1-2 words. If you don't, you need 8-10 words to describe the
same behavior. Jargon is the ultimate compression tool for prompt engineering.`,
}
