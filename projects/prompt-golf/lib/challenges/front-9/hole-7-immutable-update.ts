import type { CodeChallenge } from '@/lib/types'

export const hole7: CodeChallenge = {
  id: 'immutable-update',
  type: 'code',
  course: 'front-9',
  holeNumber: 7,
  name: 'The Water Hazard',
  description:
    'Write a function that updates a value at a given path in a nested object WITHOUT mutating the original. Returns a new object with the value changed at the specified path.',
  par: 7,
  principle: 'Constraints narrow the solution space',
  functionSignature:
    'function immutableSet(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown>',
  testCases: [
    {
      input: [{ a: { b: { c: 1 } } }, ['a', 'b', 'c'], 2],
      expected: { a: { b: { c: 2 } } },
      description: 'Update deeply nested value',
    },
    {
      input: [{ x: 1, y: 2 }, ['x'], 10],
      expected: { x: 10, y: 2 },
      description: 'Update top-level value',
    },
  ],
  edgeCases: [
    {
      input: [{}, ['a', 'b'], 1],
      expected: { a: { b: 1 } },
      description: 'Create nested path if missing',
    },
  ],
  hints: [
    'What constraint changes the approach from simple assignment?',
    'The word "immutable" or "without mutation" is key.',
    'Try: "set nested value immutably at path"',
  ],
  analyzerContext: `Common compression traps:
- "set nested value" (3 words) produces MUTABLE assignment (obj[key] = val)
- "immutably set nested value" (4 words) or "set value without mutation" (4 words) produces correct spreading
- "no mutation, return new object" (5 words) is a CONSTRAINT that eliminates the simple assignment approach
- The constraint word ("immutable", "without mutation", "pure") is load-bearing

Key insight to surface: Telling the model what NOT to do ("no mutation",
"no side effects", "no external dependencies") is a powerful prompting technique.
Constraints narrow the solution space more efficiently than describing the
implementation. This is a core principle of spec-driven development in 2026.`,
}
