import {
  SCORE_BASE_MULTIPLIER,
  SCORE_EFFICIENCY_MAX_ATTEMPTS,
  SCORE_EFFICIENCY_PER_ATTEMPT,
  SCORE_FIRST_TRY_BONUS,
} from './constants'

export function calculateScore(level: number, attemptCount: number): number {
  const base = level * SCORE_BASE_MULTIPLIER
  const efficiency =
    Math.max(0, SCORE_EFFICIENCY_MAX_ATTEMPTS - attemptCount) *
    SCORE_EFFICIENCY_PER_ATTEMPT
  const firstTry = attemptCount === 1 ? SCORE_FIRST_TRY_BONUS : 0
  return base + efficiency + firstTry
}

export const MAX_POSSIBLE_SCORE = Array.from({ length: 7 }, (_, i) =>
  calculateScore(i + 1, 1)
).reduce((a, b) => a + b, 0)
