import type { Context } from 'telegraf'

/** Interval for refreshing Telegram typing indicator (expires after 5s) */
const TYPING_REFRESH_MS = 4_000

/**
 * Keep Telegram "typing..." indicator alive while an async operation runs.
 * Sends the initial action immediately, then refreshes every 4s.
 */
export async function withTypingIndicator<T>(
  ctx: Context,
  fn: () => Promise<T>
): Promise<T> {
  // Best-effort UX — don't block the main operation if typing action fails
  await ctx.sendChatAction('typing').catch(() => {})
  const interval = setInterval(() => {
    ctx.sendChatAction('typing').catch(() => {})
  }, TYPING_REFRESH_MS)
  try {
    return await fn()
  } finally {
    clearInterval(interval)
  }
}
