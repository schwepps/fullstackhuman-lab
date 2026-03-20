import type { CodeChallenge } from '@/lib/types'

export const hole3: CodeChallenge = {
  id: 'flatten-array',
  type: 'code',
  course: 'front-9',
  holeNumber: 3,
  name: 'The Chip Shot',
  description:
    'Write a function that recursively flattens a nested array of any depth into a single-level array.',
  par: 6,
  principle: 'Precision adjectives disambiguate behavior',
  functionSignature: 'function flatten(arr: unknown[]): unknown[]',
  testCases: [
    {
      input: [[[1, [2, [3, [4]]]], 5]],
      expected: [1, 2, 3, 4, 5],
      description: 'Deeply nested',
    },
    {
      input: [
        [
          [1, 2],
          [3, 4],
        ],
      ],
      expected: [1, 2, 3, 4],
      description: 'Single level nesting',
    },
    {
      input: [[1, 2, 3]],
      expected: [1, 2, 3],
      description: 'Already flat',
    },
  ],
  edgeCases: [
    {
      input: [[]],
      expected: [],
      description: 'Empty array',
    },
    {
      input: [[[[], [[]], [1]]]],
      expected: [1],
      description: 'Nested empty arrays with one value',
    },
  ],
  hints: [
    'One adjective changes the entire algorithm here.',
    '"Flat" alone might give you one level. What word ensures ALL levels?',
    'Try: "deeply flatten nested array"',
  ],
  analyzerContext: `Common compression traps:
- "flatten" alone (1 word) often produces a SHALLOW flatten (one level)
- "deep flatten" or "deeply flatten" (2 words) signals recursive behavior
- "recursively flatten" (2 words) also works but is more technical
- "flatten all levels" (3 words) is explicit but verbose
- The adjective "deep" vs "shallow" is a single word that changes the algorithm entirely

Key insight to surface: Precision adjectives are high-leverage words.
"Deep" vs "shallow" clone, "stable" vs "unstable" sort, "strict" vs "loose"
comparison — one adjective changes the algorithm. In 2026, AI models handle
common cases well, but adjective precision still matters for controlling
depth and recursion behavior.`,
}
