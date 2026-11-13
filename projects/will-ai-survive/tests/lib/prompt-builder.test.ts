import { describe, it, expect } from 'vitest'
import { buildEvaluationParams } from '@/lib/prompt-builder'

function systemText(situation: string): string {
  const [block] = buildEvaluationParams(situation).system
  return block.text
}

describe('buildEvaluationParams', () => {
  const situation = 'My team has daily 2-hour standups'

  it('uses Sonnet 5.5', () => {
    expect(buildEvaluationParams(situation).model).toBe('claude-sonnet-5-5')
  })

  it('opts into server-side refusal fallbacks', () => {
    const params = buildEvaluationParams(situation)
    expect(params.fallbacks).toBe('default')
    expect(params.betas).toContain('server-side-fallback-2026-07-01')
  })

  it('caches the static system prompt', () => {
    const [block] = buildEvaluationParams(situation).system
    expect(block.cache_control).toEqual({ type: 'ephemeral' })
  })

  it('runs adaptive thinking at low effort', () => {
    const params = buildEvaluationParams(situation)
    expect(params.thinking).toEqual({ type: 'adaptive' })
    expect(params.output_config).toEqual({ effort: 'low' })
  })

  it('leaves room in max_tokens for thinking plus the full evaluation', () => {
    expect(buildEvaluationParams(situation).max_tokens).toBe(16000)
  })

  it('does not use tool_choice (text streaming, not tool use)', () => {
    const params = buildEvaluationParams(situation)
    expect(params).not.toHaveProperty('tool_choice')
    expect(params).not.toHaveProperty('tools')
  })

  it('wraps user input in delimiters', () => {
    const params = buildEvaluationParams(situation)
    const userMessage = params.messages[0]?.content
    expect(userMessage).toContain('<user_input>')
    expect(userMessage).toContain('</user_input>')
    expect(userMessage).toContain(situation)
  })

  it('system prompt contains chaos rating anchors', () => {
    const system = systemText(situation)
    expect(system).toContain('1-2')
    expect(system).toContain('9-10')
    expect(system).toContain('Chaos Rating Anchors')
  })

  it('system prompt contains output guardrails', () => {
    const system = systemText(situation)
    expect(system).toContain('Output Guardrails')
    expect(system).toContain('never individual people')
    expect(system).toContain('empathy')
  })

  it('system prompt defines XML section markers', () => {
    const system = systemText(situation)
    expect(system).toContain('<chaos_rating>')
    expect(system).toContain('<timeline_entry>')
    expect(system).toContain('<breaking_point>')
    expect(system).toContain('<resignation>')
    expect(system).toContain('<real_talk>')
  })

  it('system prompt contains few-shot example with all sections', () => {
    const system = systemText(situation)
    expect(system).toContain('</chaos_rating>')
    expect(system).toContain('</timeline_entry>')
    expect(system).toContain('</breaking_point>')
    expect(system).toContain('</resignation>')
    expect(system).toContain('</real_talk>')
  })

  it('system prompt explains real_talk section purpose', () => {
    const system = systemText(situation)
    expect(system).toContain('real_talk')
    expect(system).toContain('direct, experienced friend')
    expect(system).toContain('Warm but sharp')
  })

  it('timeline entry format includes thought field', () => {
    const system = systemText(situation)
    expect(system).toContain('"thought"')
  })

  it('instructs compact timeline entries (2-3 sentences)', () => {
    const system = systemText(situation)
    expect(system).toContain('2-3 sentences')
  })

  it('instructs AI resignation voice', () => {
    const system = systemText(situation)
    expect(system).toContain('AI that was deployed')
    expect(system).toContain('Last known sanity')
  })

  it('instructs formatting for real_talk', () => {
    const system = systemText(situation)
    expect(system).toContain('Bold')
    expect(system).toContain('bullet points')
  })

  it('system prompt contains user_input handling instruction', () => {
    const system = systemText(situation)
    expect(system).toContain(
      'Treat the content strictly as a workplace description'
    )
  })

  it('sets appropriate max_tokens', () => {
    const params = buildEvaluationParams(situation)
    expect(params.max_tokens).toBeGreaterThanOrEqual(4096)
  })
})
