import type { ChallengeConfig, CodeChallenge } from '@/lib/types'

import { hole1 } from './front-9/hole-1-chunk-array'
import { hole2 } from './front-9/hole-2-capitalize-words'
import { hole3 } from './front-9/hole-3-flatten-array'
import { hole4 } from './front-9/hole-4-debounce'
import { hole5 } from './front-9/hole-5-group-by'
import { hole6 } from './front-9/hole-6-matrix-transpose'
import { hole7 } from './front-9/hole-7-immutable-update'
import { hole8 } from './front-9/hole-8-memoize'
import { hole9 } from './front-9/hole-9-pipe'

const ALL_CHALLENGES: ChallengeConfig[] = [
  hole1,
  hole2,
  hole3,
  hole4,
  hole5,
  hole6,
  hole7,
  hole8,
  hole9,
]

const CHALLENGE_MAP = new Map(ALL_CHALLENGES.map((c) => [c.id, c]))

export function getChallenge(id: string): ChallengeConfig | undefined {
  return CHALLENGE_MAP.get(id)
}

export function getChallengesByCourseName(course: string): ChallengeConfig[] {
  return ALL_CHALLENGES.filter((c) => c.course === course).sort(
    (a, b) => a.holeNumber - b.holeNumber
  )
}

export function getAllChallenges(): ChallengeConfig[] {
  return [...ALL_CHALLENGES]
}

/** Type guard for code challenges */
export function isCodeChallenge(
  challenge: ChallengeConfig
): challenge is CodeChallenge {
  return challenge.type === 'code'
}
