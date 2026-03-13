const TOPICS_BY_INTENSITY = {
  low: [
    'What did you have for breakfast today?',
    "What's the last show you watched?",
    'Describe your workspace in 3 words.',
    "What's a habit you can't break?",
    "What's your go-to comfort food?",
  ],
  medium: [
    "What's your most embarrassing tech moment?",
    'Describe your morning routine, honestly.',
    "What's a hill you'll die on?",
    "What's the most boring thing you're genuinely good at?",
    "What's something you believed until embarrassingly recently?",
  ],
  high: [
    "What's a decision you regret but won't admit out loud?",
    'Describe the last time you were genuinely angry.',
    "What's a personality trait you've had to work to suppress?",
    'What do people consistently misunderstand about you?',
    "What's something you pretend to like for social reasons?",
  ],
} as const

type Intensity = keyof typeof TOPICS_BY_INTENSITY

export function getNextTopic(round: number): string {
  const intensity: Intensity =
    round <= 1 ? 'low' : round <= 3 ? 'medium' : 'high'
  const pool = TOPICS_BY_INTENSITY[intensity]
  return pool[Math.floor(Math.random() * pool.length)]
}
