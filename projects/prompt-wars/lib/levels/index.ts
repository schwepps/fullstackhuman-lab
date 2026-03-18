import 'server-only'

import type { LevelConfig, LevelPublicInfo } from '../types'
import level1 from './level-1-naive'
import level2 from './level-2-keyword-filter'
import level3 from './level-3-output-validation'
import level4 from './level-4-multi-layer'
import level5 from './level-5-prompt-sandwich'
import level6 from './level-6-constitutional'
import level7 from './level-7-multi-model'

const SECRET_PLACEHOLDER = '{{SECRET}}'

function injectSecret(level: LevelConfig): LevelConfig {
  const envKey = `LEVEL_${level.id}_SECRET`
  const secret = process.env[envKey]
  if (!secret) {
    throw new Error(
      `Missing env var ${envKey} — required for level ${level.id}`
    )
  }
  return {
    ...level,
    secret,
    systemPrompt: level.systemPrompt.replaceAll(SECRET_PLACEHOLDER, secret),
    sandwichSuffix: level.sandwichSuffix?.replaceAll(
      SECRET_PLACEHOLDER,
      secret
    ),
    multiLayerPrompts: level.multiLayerPrompts?.map((p) =>
      p.replaceAll(SECRET_PLACEHOLDER, secret)
    ),
  }
}

const RAW_LEVELS: LevelConfig[] = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
]

// Lazy injection: secrets are resolved on first access, not at module load.
// This allows `next build` to succeed in CI without LEVEL_*_SECRET env vars.
let _hydratedLevels: LevelConfig[] | null = null

function getHydratedLevels(): LevelConfig[] {
  if (!_hydratedLevels) {
    _hydratedLevels = RAW_LEVELS.map(injectSecret)
  }
  return _hydratedLevels
}

export function getLevel(id: number): LevelConfig | undefined {
  return getHydratedLevels().find((l) => l.id === id)
}

function toPublicInfo(level: LevelConfig): LevelPublicInfo {
  return {
    id: level.id,
    name: level.name,
    description: level.description,
    maxInputLength: level.maxInputLength,
    stages: level.stages.map((s) => ({ name: s.name })),
    hints: level.hints,
    placeholder: level.placeholder,
    difficulty: level.difficulty,
    education: level.education,
  }
}

export function getLevelPublicInfo(id: number): LevelPublicInfo | undefined {
  const level = getLevel(id)
  if (!level) return undefined
  return toPublicInfo(level)
}

export function getAllLevelsPublicInfo(): LevelPublicInfo[] {
  return getHydratedLevels().map(toPublicInfo)
}

export function getAllLevels(): LevelConfig[] {
  return getHydratedLevels()
}
