import { ATTEMPT_PENALTY_MULTIPLIER } from './constants'
import type { ScoreResult, ScoreLabel } from './types'

/**
 * Calculate the golf score for a swing.
 *
 * Scoring:
 * - Strokes = word count of the prompt
 * - Attempt penalty: attempt 1 = 1.0x, attempt 2 = 1.25x, etc.
 * - Effective strokes = ceil(wordCount x attemptPenalty)
 * - Relative score = effectiveStrokes - par
 * - Labels map to golf terminology
 */
export function calculateScore(
  wordCount: number,
  par: number,
  attemptNumber: number,
  isPassing: boolean
): ScoreResult {
  const attemptPenalty = 1 + (attemptNumber - 1) * ATTEMPT_PENALTY_MULTIPLIER
  const effectiveStrokes = Math.ceil(wordCount * attemptPenalty)
  const relativeScore = effectiveStrokes - par
  const label = isPassing ? getScoreLabel(relativeScore) : 'N/A'

  return {
    wordCount,
    par,
    attemptNumber,
    attemptPenalty,
    effectiveStrokes,
    relativeScore,
    label,
    isPassing,
  }
}

export function getScoreLabel(relativeScore: number): ScoreLabel | string {
  if (relativeScore <= -3) return 'Albatross'
  if (relativeScore === -2) return 'Eagle'
  if (relativeScore === -1) return 'Birdie'
  if (relativeScore === 0) return 'Par'
  if (relativeScore === 1) return 'Bogey'
  if (relativeScore === 2) return 'Double Bogey'
  if (relativeScore === 3) return 'Triple Bogey'
  return `+${relativeScore}`
}

export function getScoreCssClass(label: string): string {
  const map: Record<string, string> = {
    Albatross: 'score-albatross',
    Eagle: 'score-eagle',
    Birdie: 'score-birdie',
    Par: 'score-par',
    Bogey: 'score-bogey',
    'Double Bogey': 'score-double-bogey',
    'Triple Bogey': 'score-double-bogey',
  }
  return map[label] ?? 'score-double-bogey'
}

export function getCelebrationMessage(label: string): string {
  switch (label) {
    case 'Albatross':
      return 'Albatross! Legendary precision.'
    case 'Eagle':
      return 'Eagle! Masterful compression.'
    case 'Birdie':
      return 'Birdie! One under par.'
    case 'Par':
      return 'Clean swing. Right on par.'
    case 'Bogey':
      return 'The wind was rough. Try again.'
    case 'Double Bogey':
      return 'Tough hole. You can do better.'
    case 'Triple Bogey':
      return 'Long day on the course. Keep swinging.'
    default:
      return 'The rough is deep out here.'
  }
}
