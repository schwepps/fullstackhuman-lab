import { describe, it, expect, vi, beforeEach } from 'vitest'
import { log } from '@/lib/logger'

describe('log', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('emits JSON to stdout with correct structure', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    log('info', 'test_event', { key: 'value' })

    expect(spy).toHaveBeenCalledOnce()
    const output = JSON.parse(spy.mock.calls[0][0] as string)
    expect(output.level).toBe('info')
    expect(output.event).toBe('test_event')
    expect(output.key).toBe('value')
  })

  it('includes a valid ISO timestamp', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    log('warn', 'test_event')

    const output = JSON.parse(spy.mock.calls[0][0] as string)
    expect(output.timestamp).toBeDefined()
    // Verify it's a valid ISO date
    expect(new Date(output.timestamp).toISOString()).toBe(output.timestamp)
  })

  it('works without optional data parameter', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    log('error', 'no_data')

    expect(spy).toHaveBeenCalledOnce()
    const output = JSON.parse(spy.mock.calls[0][0] as string)
    expect(output.level).toBe('error')
    expect(output.event).toBe('no_data')
  })

  it('silently drops internal errors without throwing', () => {
    // Force JSON.stringify to throw by creating a circular reference
    vi.spyOn(console, 'log').mockImplementation(() => {
      throw new Error('stdout broken')
    })

    // Should not throw
    expect(() => log('info', 'test')).not.toThrow()
  })
})
