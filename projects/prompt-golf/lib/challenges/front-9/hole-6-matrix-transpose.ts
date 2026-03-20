import type { CodeChallenge } from '@/lib/types'

export const hole6: CodeChallenge = {
  id: 'matrix-transpose',
  type: 'code',
  course: 'front-9',
  holeNumber: 6,
  name: 'The Bunker Shot',
  description:
    'Write a function that transposes a 2D matrix — rows become columns and columns become rows.',
  par: 7,
  principle: "Show, don't tell — I/O examples beat descriptions",
  functionSignature: 'function transpose<T>(matrix: T[][]): T[][]',
  testCases: [
    {
      input: [
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
      ],
      expected: [
        [1, 4],
        [2, 5],
        [3, 6],
      ],
      description: '2x3 matrix becomes 3x2',
    },
    {
      input: [
        [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      ],
      expected: [
        [1, 3, 5],
        [2, 4, 6],
      ],
      description: '3x2 matrix becomes 2x3',
    },
  ],
  edgeCases: [
    {
      input: [[[1]]],
      expected: [[1]],
      description: '1x1 matrix',
    },
    {
      input: [[]],
      expected: [],
      description: 'Empty matrix',
    },
  ],
  hints: [
    'Sometimes showing input/output is clearer than describing the operation.',
    '"Swap rows and columns" is ambiguous. Can you show it?',
    'Try: "[[1,2],[3,4]] becomes [[1,3],[2,4]]"',
  ],
  analyzerContext: `Common compression traps:
- "transpose matrix" (2 words) works well — "transpose" is a precise math term
- "swap rows and columns" (4 words) is ambiguous — does it mean reverse rows?
- "rows become columns" (3 words) is clearer than "swap"
- Showing an I/O example like "[[1,2],[3,4]] to [[1,3],[2,4]]" is unambiguous
  but costs more words (numbers count as words)
- The example approach costs ~8 words but eliminates ALL ambiguity

Key insight to surface: Research shows I/O format specification is the 2nd most
applied prompt optimization at 44% of cases (Mao et al. 2025). For ambiguous
operations, a concrete example ("this input produces this output") can replace
paragraphs of description. The trade-off: examples cost more words but guarantee
correct interpretation. In prompt golf, "transpose" (1 word) beats the example,
but for harder challenges where no single word captures the operation, examples win.`,
}
