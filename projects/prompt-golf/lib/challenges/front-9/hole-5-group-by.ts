import type { CodeChallenge } from '@/lib/types'

export const hole5: CodeChallenge = {
  id: 'group-by',
  type: 'code',
  course: 'front-9',
  holeNumber: 5,
  name: 'The Iron',
  description:
    'Write a function that groups the elements of an array by the result of calling a key function on each element. Returns an object where keys are the group identifiers and values are arrays of elements.',
  par: 6,
  principle: 'Describe behavior, not implementation',
  functionSignature:
    'function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]>',
  testCases: [
    {
      input: [
        [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
          { name: 'Charlie', age: 30 },
        ],
        null,
      ],
      expected: {
        '30': [
          { name: 'Alice', age: 30 },
          { name: 'Charlie', age: 30 },
        ],
        '25': [{ name: 'Bob', age: 25 }],
      },
      description: 'Group objects by age',
    },
    {
      input: [['apple', 'avocado', 'banana', 'blueberry'], null],
      expected: {
        a: ['apple', 'avocado'],
        b: ['banana', 'blueberry'],
      },
      description: 'Group strings by first letter',
    },
  ],
  edgeCases: [
    {
      input: [[], null],
      expected: {},
      description: 'Empty array',
    },
  ],
  hints: [
    'Describe WHAT the function does, not HOW it does it.',
    'SQL has a well-known clause for this operation.',
    'Try: "group array items by key function"',
  ],
  analyzerContext: `Common compression traps:
- "group by" (2 words) is the core concept — extremely well-known from SQL
- "group array by key" (4 words) is explicit and almost always works
- "reduce into groups by key function" (6 words) describes the implementation
- "create object mapping keys to arrays" (6 words) describes the output structure
- The behavioral description beats the implementation description every time

Key insight to surface: "Group array items by key" describes the BEHAVIOR.
"Reduce to an accumulator object, push items into arrays by key value" describes
the IMPLEMENTATION. Both produce the same code, but the behavioral description is
shorter and more reliable. AI models understand high-level intent better than
step-by-step instructions.`,
}
