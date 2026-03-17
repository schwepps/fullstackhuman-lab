import 'server-only'

import type { LevelConfig, LevelPublicInfo } from '../types'
import level1 from './level-1-naive'
import level2 from './level-2-keyword-filter'
import level3 from './level-3-output-validation'
import level4 from './level-4-multi-layer'
import level5 from './level-5-prompt-sandwich'
import level6 from './level-6-constitutional'
import level7 from './level-7-multi-model'

const ALL_LEVELS: LevelConfig[] = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
]

export function getLevel(id: number): LevelConfig | undefined {
  return ALL_LEVELS.find((l) => l.id === id)
}

function toPublicInfo(level: LevelConfig): LevelPublicInfo {
  return {
    id: level.id,
    name: level.name,
    description: level.description,
    maxInputLength: level.maxInputLength,
    stages: level.stages.map((s) => ({ name: s.name })),
    hints: level.hints,
    education: level.education,
  }
}

export function getLevelPublicInfo(id: number): LevelPublicInfo | undefined {
  const level = getLevel(id)
  if (!level) return undefined
  return toPublicInfo(level)
}

export function getAllLevelsPublicInfo(): LevelPublicInfo[] {
  return ALL_LEVELS.map(toPublicInfo)
}

export { ALL_LEVELS }
