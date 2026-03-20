import { describe, it, expect } from 'vitest'
import { AI_SKILLS, getSkillForRound } from '@/lib/techniques'

describe('AI_SKILLS', () => {
  it('has 7 skills defined', () => {
    expect(AI_SKILLS).toHaveLength(7)
  })

  it('each skill has required fields', () => {
    for (const skill of AI_SKILLS) {
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
      expect(skill.tip).toBeTruthy()
      expect(skill.example).toBeTruthy()
      expect(skill.postVerdictTemplate).toContain('{detail}')
    }
  })

  it('last skill is wild card', () => {
    expect(AI_SKILLS[AI_SKILLS.length - 1].id).toBe('wildcard')
  })
})

describe('getSkillForRound', () => {
  it('returns first skill for round 0', () => {
    expect(getSkillForRound(0)).toBe(AI_SKILLS[0])
  })

  it('cycles back after all skills used', () => {
    expect(getSkillForRound(7)).toBe(AI_SKILLS[0])
    expect(getSkillForRound(14)).toBe(AI_SKILLS[0])
  })

  it('returns correct skill for round 3', () => {
    expect(getSkillForRound(3)).toBe(AI_SKILLS[3])
  })
})
