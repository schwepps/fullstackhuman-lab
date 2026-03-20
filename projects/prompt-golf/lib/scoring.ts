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
  if (wordCount < 0 || !Number.isFinite(wordCount)) {
    throw new Error('wordCount must be a non-negative finite number')
  }
  if (par < 1 || !Number.isInteger(par)) {
    throw new Error('par must be a positive integer')
  }
  if (attemptNumber < 1 || !Number.isInteger(attemptNumber)) {
    throw new Error('attemptNumber must be a positive integer')
  }

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

export function getScoreLabel(relativeScore: number): ScoreLabel {
  if (relativeScore <= -3) return 'Albatross'
  if (relativeScore === -2) return 'Eagle'
  if (relativeScore === -1) return 'Birdie'
  if (relativeScore === 0) return 'Par'
  if (relativeScore === 1) return 'Bogey'
  if (relativeScore === 2) return 'Double Bogey'
  if (relativeScore === 3) return 'Triple Bogey'
  return `+${relativeScore}`
}

/** Display label with +/- meaning for non-golfers: "Birdie (-1)" */
export function getScoreDisplayLabel(label: string): string {
  const meanings: Record<string, string> = {
    Albatross: 'Albatross (-3)',
    Eagle: 'Eagle (-2)',
    Birdie: 'Birdie (-1)',
    Par: 'Par (0)',
    Bogey: 'Bogey (+1)',
    'Double Bogey': 'Double Bogey (+2)',
    'Triple Bogey': 'Triple Bogey (+3)',
    'N/A': 'N/A',
  }
  return meanings[label] ?? label
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
      return 'Albatross! The AI just tipped its hat.'
    case 'Eagle':
      return 'Eagle! The clubhouse is buzzing.'
    case 'Birdie':
      return 'Birdie! One under par. The caddie approves.'
    case 'Par':
      return 'Par. Solid, respectable, dry martini energy.'
    case 'Bogey':
      return 'Bogey. The caddie politely looks away.'
    case 'Double Bogey':
      return 'Double Bogey. The bartender at the 19th Hole starts pouring early.'
    case 'Triple Bogey':
      return 'Triple Bogey. Your clubs have filed a formal complaint.'
    default:
      return 'The rough is deep, and so is character development.'
  }
}
