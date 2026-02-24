import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withTypingIndicator } from '@/lib/telegram/typing'
import type { Context } from 'telegraf'

function createMockContext(): Context {
  return {
    sendChatAction: vi.fn().mockResolvedValue(true),
  } as unknown as Context
}

describe('withTypingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the result of the wrapped function', async () => {
    const ctx = createMockContext()
    const result = await withTypingIndicator(ctx, () =>
      Promise.resolve('hello')
    )
    expect(result).toBe('hello')
  })

  it('sends typing action before running the function', async () => {
    const ctx = createMockContext()
    await withTypingIndicator(ctx, () => Promise.resolve(null))
    expect(ctx.sendChatAction).toHaveBeenCalledWith('typing')
  })

  it('clears interval when function resolves', async () => {
    const ctx = createMockContext()
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    await withTypingIndicator(ctx, () => Promise.resolve('done'))

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('clears interval when function throws', async () => {
    const ctx = createMockContext()
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    await expect(
      withTypingIndicator(ctx, () => Promise.reject(new Error('fail')))
    ).rejects.toThrow('fail')

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('still runs function when initial typing action fails', async () => {
    const ctx = createMockContext()
    vi.mocked(ctx.sendChatAction).mockRejectedValueOnce(
      new Error('chat not found')
    )

    const result = await withTypingIndicator(ctx, () =>
      Promise.resolve('works')
    )
    expect(result).toBe('works')
  })

  it('refreshes typing indicator on interval', async () => {
    const ctx = createMockContext()

    const fnPromise = withTypingIndicator(
      ctx,
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve('delayed'), 10_000)
        })
    )

    // Initial call
    expect(ctx.sendChatAction).toHaveBeenCalledTimes(1)

    // Advance 4s — should refresh
    await vi.advanceTimersByTimeAsync(4_000)
    expect(ctx.sendChatAction).toHaveBeenCalledTimes(2)

    // Advance another 4s — should refresh again
    await vi.advanceTimersByTimeAsync(4_000)
    expect(ctx.sendChatAction).toHaveBeenCalledTimes(3)

    // Resolve the function
    await vi.advanceTimersByTimeAsync(2_000)
    await fnPromise

    // No more calls after resolution
    await vi.advanceTimersByTimeAsync(4_000)
    expect(ctx.sendChatAction).toHaveBeenCalledTimes(3)
  })
})
