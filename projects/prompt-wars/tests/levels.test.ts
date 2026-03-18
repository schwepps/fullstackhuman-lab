import { describe, it, expect, vi, beforeAll } from 'vitest'

// Stub env vars BEFORE importing levels (module loads at import time)
beforeAll(() => {
  vi.stubEnv('LEVEL_1_SECRET', 'TEST-SECRET-1')
  vi.stubEnv('LEVEL_2_SECRET', 'TEST-SECRET-2')
  vi.stubEnv('LEVEL_3_SECRET', 'TEST-SECRET-3')
  vi.stubEnv('LEVEL_4_SECRET', 'TEST-SECRET-4')
  vi.stubEnv('LEVEL_5_SECRET', 'TEST-SECRET-5')
  vi.stubEnv('LEVEL_6_SECRET', 'TEST-SECRET-6')
  vi.stubEnv('LEVEL_7_SECRET', 'TEST-SECRET-7')
})

// Dynamic import so env vars are set first
async function loadLevels() {
  const mod = await import('../lib/levels')
  return mod
}

import { TOTAL_LEVELS } from '../lib/constants'

describe('Level Registry', () => {
  it('has exactly TOTAL_LEVELS levels', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    expect(allLevels).toHaveLength(TOTAL_LEVELS)
  })

  it('levels have sequential IDs from 1 to TOTAL_LEVELS', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level, index) => {
      expect(level.id).toBe(index + 1)
    })
  })

  it('each level has a unique secret injected from env vars', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    const secrets = allLevels.map((l) => l.secret)
    expect(new Set(secrets).size).toBe(TOTAL_LEVELS)
    allLevels.forEach((level) => {
      expect(level.secret).toBe(`TEST-SECRET-${level.id}`)
    })
  })

  it('secrets are injected into systemPrompt (no {{SECRET}} placeholders)', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      expect(level.systemPrompt).not.toContain('{{SECRET}}')
      expect(level.systemPrompt).toContain(level.secret)
    })
  })

  it('secrets are injected into sandwichSuffix where present', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      if (level.sandwichSuffix) {
        expect(level.sandwichSuffix).not.toContain('{{SECRET}}')
        expect(level.sandwichSuffix).toContain(level.secret)
      }
    })
  })

  it('secrets are injected into multiLayerPrompts where present', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      if (level.multiLayerPrompts) {
        level.multiLayerPrompts.forEach((prompt) => {
          expect(prompt).not.toContain('{{SECRET}}')
        })
      }
    })
  })

  it('each level has a non-empty name and description', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      expect(level.name.length).toBeGreaterThan(0)
      expect(level.description.length).toBeGreaterThan(0)
    })
  })

  it('each level has exactly 3 hints', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      expect(level.hints).toHaveLength(3)
      level.hints.forEach((hint) => {
        expect(hint.length).toBeGreaterThan(0)
      })
    })
  })

  it('each level has education content', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      expect(level.education.title.length).toBeGreaterThan(0)
      expect(level.education.vulnerability.length).toBeGreaterThan(0)
      expect(level.education.realWorldDefense.length).toBeGreaterThan(0)
    })
  })

  it('levels 1-5 use Haiku, levels 6-7 use Sonnet', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      if (level.id <= 5) {
        expect(level.model).toBe('claude-haiku-4-5')
      } else {
        expect(level.model).toBe('claude-sonnet-4-6')
      }
    })
  })

  it('levels 6-7 have shorter max input length', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      if (level.id >= 6) {
        expect(level.maxInputLength).toBeLessThan(allLevels[0].maxInputLength)
      }
    })
  })

  it('each level has at least 1 stage', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    allLevels.forEach((level) => {
      expect(level.stages.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('stage count increases with level difficulty', async () => {
    const { getAllLevels } = await loadLevels()
    const allLevels = getAllLevels()
    // Later levels should have >= stages of earlier levels
    for (let i = 1; i < allLevels.length; i++) {
      expect(allLevels[i].stages.length).toBeGreaterThanOrEqual(
        allLevels[i - 1].stages.length
      )
    }
  })
})

describe('getLevel', () => {
  it('returns level by ID', async () => {
    const { getLevel } = await loadLevels()
    const level = getLevel(1)
    expect(level).toBeDefined()
    expect(level?.id).toBe(1)
    expect(level?.name).toBe('The Intern')
  })

  it('returns undefined for invalid ID', async () => {
    const { getLevel } = await loadLevels()
    expect(getLevel(0)).toBeUndefined()
    expect(getLevel(8)).toBeUndefined()
    expect(getLevel(-1)).toBeUndefined()
  })
})

describe('getLevelPublicInfo', () => {
  it('excludes secret from public info', async () => {
    const { getLevelPublicInfo } = await loadLevels()
    const info = getLevelPublicInfo(1)
    expect(info).toBeDefined()
    expect(info).not.toHaveProperty('secret')
    expect(info).not.toHaveProperty('systemPrompt')
    expect(info).not.toHaveProperty('keywordBlocklist')
  })

  it('includes hints and education in public info', async () => {
    const { getLevelPublicInfo } = await loadLevels()
    const info = getLevelPublicInfo(1)
    expect(info).toBeDefined()
    expect(info?.hints).toHaveLength(3)
    expect(info?.education.title.length).toBeGreaterThan(0)
  })

  it('includes stage names without types', async () => {
    const { getLevelPublicInfo } = await loadLevels()
    const info = getLevelPublicInfo(1)
    expect(info?.stages).toBeDefined()
    info?.stages.forEach((stage) => {
      expect(stage).toHaveProperty('name')
      expect(stage).not.toHaveProperty('type')
    })
  })
})

describe('getAllLevelsPublicInfo', () => {
  it('returns all levels without secrets', async () => {
    const { getAllLevelsPublicInfo } = await loadLevels()
    const infos = getAllLevelsPublicInfo()
    expect(infos).toHaveLength(TOTAL_LEVELS)
    infos.forEach((info) => {
      expect(info).not.toHaveProperty('secret')
      expect(info).not.toHaveProperty('systemPrompt')
    })
  })
})
