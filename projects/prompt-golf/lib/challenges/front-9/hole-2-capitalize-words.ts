import type { CodeChallenge } from '@/lib/types'

export const hole2: CodeChallenge = {
  id: 'capitalize-words',
  type: 'code',
  course: 'front-9',
  holeNumber: 2,
  name: 'The Approach',
  description:
    'Write a function that capitalizes the first letter of each word in a string. Words are separated by spaces.',
  par: 6,
  principle: 'Describe the output, not the steps',
  functionSignature: 'function capitalizeWords(str: string): string',
  testCases: [
    {
      input: ['hello world'],
      expected: 'Hello World',
      description: 'Two words',
    },
    {
      input: ['the quick brown fox'],
      expected: 'The Quick Brown Fox',
      description: 'Multiple words',
    },
    {
      input: ['javascript'],
      expected: 'Javascript',
      description: 'Single word',
    },
  ],
  edgeCases: [
    {
      input: [''],
      expected: '',
      description: 'Empty string',
    },
    {
      input: ['already Capitalized Words'],
      expected: 'Already Capitalized Words',
      description: 'Mixed case input',
    },
  ],
  hints: [
    'Focus on describing what the output looks like, not how to get there.',
    'What transformation happens to each word?',
    'Try: "capitalize first letter of each word"',
  ],
  analyzerContext: `Common compression traps:
- "capitalize first letter of each word" (6 words) describes the OUTPUT
- "split by space, uppercase first char, join" (7 words) describes the STEPS — same length but less clear
- "title case" (2 words) is the domain term but may produce different behavior (articles, prepositions)
- "capitalize words" (2 words) often works because the function name IS the description

Key insight to surface: Describing the desired output is almost always shorter
than describing the implementation steps. "Capitalize each word" tells the AI
WHAT you want. "Split, map first character to uppercase, join" tells it HOW.
The AI already knows HOW — it just needs to know WHAT.`,
}
