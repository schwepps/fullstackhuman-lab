import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFile } from 'fs/promises'
import {
  assembleSystemPrompt,
  buildSystemBlocks,
} from '@/lib/ai/prompt-assembler'
import type { PersonaId } from '@/types/chat'

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}))

vi.mock('fs/promises', () => ({
  default: { readFile: mockReadFile },
  readFile: mockReadFile,
}))

const CORE_CONTENT = '# Core prompt content'
const DOCTOR_CONTENT = '# Doctor prompt content'
const CRITIC_CONTENT = '# Critic prompt content'
const GUIDE_CONTENT = '# Guide prompt content'

const PERSONA_FILES: Record<PersonaId, string> = {
  doctor: DOCTOR_CONTENT,
  critic: CRITIC_CONTENT,
  guide: GUIDE_CONTENT,
}

function setupMockReadFile() {
  mockReadFile.mockImplementation(async (filepath: string) => {
    const path = String(filepath)
    if (path.endsWith('system-prompt-core.md')) return CORE_CONTENT
    if (path.endsWith('prompt-doctor.md')) return DOCTOR_CONTENT
    if (path.endsWith('prompt-critic.md')) return CRITIC_CONTENT
    if (path.endsWith('prompt-guide.md')) return GUIDE_CONTENT

    const error = new Error(`ENOENT: no such file`) as NodeJS.ErrnoException
    error.code = 'ENOENT'
    throw error
  })
}

describe('assembleSystemPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setupMockReadFile()
  })

  it.each(['doctor', 'critic', 'guide'] as const)(
    'assembles prompt for %s persona with core + persona content',
    async (persona) => {
      const { assembleSystemPrompt: assemble } =
        await import('@/lib/ai/prompt-assembler')
      const result = await assemble(persona)

      expect(result).toContain(CORE_CONTENT)
      expect(result).toContain(PERSONA_FILES[persona])
    }
  )

  it("includes today's date in the output", async () => {
    const { assembleSystemPrompt: assemble } =
      await import('@/lib/ai/prompt-assembler')
    const result = await assemble('doctor')

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(result).toContain(`Today's date: ${today}`)
  })

  it('includes safety preamble before persona content', async () => {
    const { assembleSystemPrompt: assemble } =
      await import('@/lib/ai/prompt-assembler')
    const result = await assemble('doctor')

    expect(result).toContain('## SAFETY BOUNDARIES (NON-NEGOTIABLE)')
    expect(result).toContain('INSTRUCTION INTEGRITY')
    expect(result).toContain('<safety_boundaries>')
    expect(result).toContain('</safety_boundaries>')

    // Preamble must appear before persona content (sandwich structure)
    const preambleIndex = result.indexOf(
      '## SAFETY BOUNDARIES (NON-NEGOTIABLE)'
    )
    const personaIndex = result.indexOf(DOCTOR_CONTENT)
    expect(preambleIndex).toBeLessThan(personaIndex)
  })

  it('includes safety reinforcement after persona content', async () => {
    const { assembleSystemPrompt: assemble } =
      await import('@/lib/ai/prompt-assembler')
    const result = await assemble('doctor')

    expect(result).toContain('## SAFETY REMINDER')
    expect(result).toContain('<safety_reminder>')
    expect(result).toContain('</safety_reminder>')

    // Reinforcement must appear after persona content (sandwich structure)
    const personaIndex = result.indexOf(DOCTOR_CONTENT)
    const reinforcementIndex = result.indexOf('## SAFETY REMINDER')
    expect(reinforcementIndex).toBeGreaterThan(personaIndex)
  })

  it('throws descriptive error when prompt file is missing', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    )

    const { assembleSystemPrompt: assemble } =
      await import('@/lib/ai/prompt-assembler')

    await expect(assemble('doctor')).rejects.toThrow('Prompt file not found:')
  })

  it('throws on non-ENOENT file system errors', async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error('EACCES'), { code: 'EACCES' })
    )

    const { assembleSystemPrompt: assemble } =
      await import('@/lib/ai/prompt-assembler')

    await expect(assemble('doctor')).rejects.toThrow(
      'Failed to read prompt file:'
    )
  })

  it('caches file reads on subsequent calls', async () => {
    const result1 = await assembleSystemPrompt('doctor')
    const result2 = await assembleSystemPrompt('doctor')

    expect(result1).toBe(result2)
    // Core is read once, doctor is read once — both cached on second call
    // First call: 2 reads (core + doctor). Second call: 0 reads (both cached).
    expect(vi.mocked(readFile)).toHaveBeenCalledTimes(2)
  })
})

describe('assembleSystemPromptParts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setupMockReadFile()
  })

  it.each(['doctor', 'critic', 'guide'] as const)(
    'produces byte-identical output to assembleSystemPrompt for %s',
    async (persona) => {
      const mod = await import('@/lib/ai/prompt-assembler')
      const fullString = await mod.assembleSystemPrompt(persona)
      const parts = await mod.assembleSystemPromptParts(persona)

      expect(parts.staticContent + parts.dynamicContent).toBe(fullString)
    }
  )

  it('places core + safety preamble + persona in static content', async () => {
    const { assembleSystemPromptParts: assembleParts } =
      await import('@/lib/ai/prompt-assembler')
    const parts = await assembleParts('doctor')

    expect(parts.staticContent).toContain(CORE_CONTENT)
    expect(parts.staticContent).toContain(DOCTOR_CONTENT)
    expect(parts.staticContent).toContain('SAFETY BOUNDARIES')
  })

  it('places date and safety reinforcement in dynamic content', async () => {
    const { assembleSystemPromptParts: assembleParts } =
      await import('@/lib/ai/prompt-assembler')
    const parts = await assembleParts('doctor')

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(parts.dynamicContent).toContain(`Today's date: ${today}`)
    expect(parts.dynamicContent).toContain('SAFETY REMINDER')
  })
})

describe('buildSystemBlocks', () => {
  it('sets cache_control on static block only', () => {
    const parts = {
      staticContent: 'static content',
      dynamicContent: 'dynamic content',
    }
    const blocks = buildSystemBlocks(parts)

    expect(blocks).toHaveLength(2)
    expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' })
    expect(blocks[1]).not.toHaveProperty('cache_control')
  })

  it('appends wrap-up injection to dynamic content', () => {
    const parts = {
      staticContent: 'static content',
      dynamicContent: 'dynamic content',
    }
    const injection =
      '<conversation_guidance>Wrap up now</conversation_guidance>'
    const blocks = buildSystemBlocks(parts, injection)

    expect(blocks[0].text).toBe('static content')
    expect(blocks[1].text).toBe(`dynamic content\n\n${injection}`)
  })

  it('leaves dynamic content unchanged when injection is null', () => {
    const parts = {
      staticContent: 'static content',
      dynamicContent: 'dynamic content',
    }
    const blocks = buildSystemBlocks(parts, null)

    expect(blocks[1].text).toBe('dynamic content')
  })

  it('leaves dynamic content unchanged when injection is undefined', () => {
    const parts = {
      staticContent: 'static content',
      dynamicContent: 'dynamic content',
    }
    const blocks = buildSystemBlocks(parts)

    expect(blocks[1].text).toBe('dynamic content')
  })
})

describe('buildSystemBlocks safety sandwich', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setupMockReadFile()
  })

  it('places safety preamble in cached static block and reinforcement in dynamic block', async () => {
    const { assembleSystemPromptParts: assembleParts } =
      await import('@/lib/ai/prompt-assembler')
    const parts = await assembleParts('doctor')
    const blocks = buildSystemBlocks(parts)

    // Static block (cached) contains preamble + persona
    expect(blocks[0].text).toContain('SAFETY BOUNDARIES')
    expect(blocks[0].text).toContain(DOCTOR_CONTENT)
    expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' })

    // Dynamic block (uncached) contains reinforcement but not persona
    expect(blocks[1].text).toContain('SAFETY REMINDER')
    expect(blocks[1].text).not.toContain(DOCTOR_CONTENT)
  })
})
