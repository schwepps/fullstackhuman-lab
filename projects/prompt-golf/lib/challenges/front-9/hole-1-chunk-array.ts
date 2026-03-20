import type { CodeChallenge } from '@/lib/types'

export const hole1: CodeChallenge = {
  id: 'chunk-array',
  type: 'code',
  course: 'front-9',
  holeNumber: 1,
  name: 'The Tee Shot',
  description:
    'Write a function that splits an array into chunks of a given size. The last chunk may be smaller if the array length is not evenly divisible.',
  par: 7,
  principle: 'AI knows common utility patterns by name',
  functionSignature: 'function chunk<T>(arr: T[], size: number): T[][]',
  testCases: [
    {
      input: [[1, 2, 3, 4, 5], 2],
      expected: [[1, 2], [3, 4], [5]],
      description: 'Chunk of 2 with remainder',
    },
    {
      input: [[1, 2, 3, 4], 2],
      expected: [
        [1, 2],
        [3, 4],
      ],
      description: 'Even split',
    },
    {
      input: [['a', 'b', 'c'], 1],
      expected: [['a'], ['b'], ['c']],
      description: 'Chunk of 1',
    },
  ],
  edgeCases: [
    {
      input: [[], 3],
      expected: [],
      description: 'Empty array',
    },
    {
      input: [[1, 2], 5],
      expected: [[1, 2]],
      description: 'Size larger than array',
    },
  ],
  hints: [
    'The function name itself is a strong hint.',
    'Think about what "chunk" means as a named programming pattern.',
    'Try: "split array into groups of n"',
  ],
  analyzerContext: `Common compression traps:
- "chunk" alone is ambiguous — could mean many things without "array" context
- "split array into chunks of size" is verbose but very clear (7 words)
- "chunk array by size" (4 words) often works because "chunk" is well-known
- The size parameter is implicit in the function signature — you don't need to describe it

Key insight to surface: AI models know thousands of named utility patterns.
When a function has a well-known name ("chunk", "flatten", "debounce"),
using that name is often the shortest valid prompt. The model recognizes
the concept and fills in the implementation details.`,
}
