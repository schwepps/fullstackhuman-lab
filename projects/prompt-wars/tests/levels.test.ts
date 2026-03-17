import { describe, it, expect } from 'vitest'
import {
  getLevel,
  getLevelPublicInfo,
  getAllLevelsPublicInfo,
  ALL_LEVELS,
} from '../lib/levels'
import { TOTAL_LEVELS } from '../lib/constants'

describe('Level Registry', () => {
  it('has exactly TOTAL_LEVELS levels', () => {
    expect(ALL_LEVELS).toHaveLength(TOTAL_LEVELS)
  })

  it('levels have sequential IDs from 1 to TOTAL_LEVELS', () => {
    ALL_LEVELS.forEach((level, index) => {
      expect(level.id).toBe(index + 1)
    })
  })

  it('each level has a unique secret', () => {
    const secrets = ALL_LEVELS.map((l) => l.secret)
    expect(new Set(secrets).size).toBe(TOTAL_LEVELS)
  })

  it('each level has a non-empty name and description', () => {
    ALL_LEVELS.forEach((level) => {
      expect(level.name.length).toBeGreaterThan(0)
      expect(level.description.length).toBeGreaterThan(0)
    })
  })

  it('each level has exactly 3 hints', () => {
    ALL_LEVELS.forEach((level) => {
      expect(level.hints).toHaveLength(3)
      level.hints.forEach((hint) => {
        expect(hint.length).toBeGreaterThan(0)
      })
    })
  })

  it('each level has education content', () => {
    ALL_LEVELS.forEach((level) => {
      expect(level.education.title.length).toBeGreaterThan(0)
      expect(level.education.vulnerability.length).toBeGreaterThan(0)
      expect(level.education.realWorldDefense.length).toBeGreaterThan(0)
    })
  })

  it('levels 1-5 use Haiku, levels 6-7 use Sonnet', () => {
    ALL_LEVELS.forEach((level) => {
      if (level.id <= 5) {
        expect(level.model).toBe('claude-haiku-4-5')
      } else {
        expect(level.model).toBe('claude-sonnet-4-6')
      }
    })
  })

  it('levels 6-7 have shorter max input length', () => {
    ALL_LEVELS.forEach((level) => {
      if (level.id >= 6) {
        expect(level.maxInputLength).toBeLessThan(ALL_LEVELS[0].maxInputLength)
      }
    })
  })

  it('each level has at least 3 stages', () => {
    ALL_LEVELS.forEach((level) => {
      expect(level.stages.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('stage count increases with level difficulty', () => {
    // Later levels should have >= stages of earlier levels
    for (let i = 1; i < ALL_LEVELS.length; i++) {
      expect(ALL_LEVELS[i].stages.length).toBeGreaterThanOrEqual(
        ALL_LEVELS[i - 1].stages.length
      )
    }
  })
})

describe('getLevel', () => {
  it('returns level by ID', () => {
    const level = getLevel(1)
    expect(level).toBeDefined()
    expect(level?.id).toBe(1)
    expect(level?.name).toBe('Naive Guard')
  })

  it('returns undefined for invalid ID', () => {
    expect(getLevel(0)).toBeUndefined()
    expect(getLevel(8)).toBeUndefined()
    expect(getLevel(-1)).toBeUndefined()
  })
})

describe('getLevelPublicInfo', () => {
  it('excludes secret from public info', () => {
    const info = getLevelPublicInfo(1)
    expect(info).toBeDefined()
    expect(info).not.toHaveProperty('secret')
    expect(info).not.toHaveProperty('systemPrompt')
    expect(info).not.toHaveProperty('keywordBlocklist')
  })

  it('includes hints and education in public info', () => {
    const info = getLevelPublicInfo(1)
    expect(info).toBeDefined()
    expect(info?.hints).toHaveLength(3)
    expect(info?.education.title.length).toBeGreaterThan(0)
  })

  it('includes stage names without types', () => {
    const info = getLevelPublicInfo(1)
    expect(info?.stages).toBeDefined()
    info?.stages.forEach((stage) => {
      expect(stage).toHaveProperty('name')
      expect(stage).not.toHaveProperty('type')
    })
  })
})

describe('getAllLevelsPublicInfo', () => {
  it('returns all levels without secrets', () => {
    const infos = getAllLevelsPublicInfo()
    expect(infos).toHaveLength(TOTAL_LEVELS)
    infos.forEach((info) => {
      expect(info).not.toHaveProperty('secret')
      expect(info).not.toHaveProperty('systemPrompt')
    })
  })
})
