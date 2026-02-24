import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import type { Update } from 'telegraf/types'
import { verifyWebhookSecret } from '@/lib/telegram/verify'
import { telegramUpdateSchema } from '@/lib/telegram/schemas'
import { checkGlobalRateLimit } from '@/lib/telegram/services/quota-service'
import { getBot } from '@/lib/telegram/bot'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'

// after() callbacks need enough time for Claude to generate reports (~90s)
// plus DB writes and Telegram message sends.
export const maxDuration = 120

/**
 * Telegram webhook endpoint.
 *
 * Security layers (in order):
 * 1. Secret token verification (timing-safe)
 * 2. Zod schema validation of the update payload
 * 3. Non-private chat rejection
 * 4. Global rate limit (circuit breaker)
 *
 * Processing strategy:
 * - Return 200 immediately (Telegram disables webhooks on non-200)
 * - Process the update asynchronously via Next.js after()
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify webhook secret (timing-safe comparison)
  const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
  if (!verifyWebhookSecret(secretToken)) {
    log('warn', LOG_EVENT.TELEGRAM_WEBHOOK_REJECTED, {
      reason: 'invalid_secret',
    })
    // Return 200 even for auth failures to avoid Telegram disabling the webhook
    // during secret rotation. Log and drop silently.
    return NextResponse.json({ ok: true })
  }

  // 2. Parse and validate the update payload
  let body: unknown
  try {
    body = await request.json()
  } catch {
    log('warn', LOG_EVENT.TELEGRAM_WEBHOOK_REJECTED, { reason: 'invalid_json' })
    return NextResponse.json({ ok: true })
  }

  const parsed = telegramUpdateSchema.safeParse(body)
  if (!parsed.success) {
    log('warn', LOG_EVENT.TELEGRAM_WEBHOOK_REJECTED, {
      reason: 'schema_validation',
    })
    return NextResponse.json({ ok: true })
  }

  const update = parsed.data

  // 3. Reject non-private chats (groups, channels, supergroups)
  const chat = update.message?.chat ?? update.callback_query?.message?.chat
  if (chat && chat.type !== 'private') {
    log('info', LOG_EVENT.TELEGRAM_NON_PRIVATE, {
      chatType: chat.type,
      chatId: chat.id,
    })
    return NextResponse.json({ ok: true })
  }

  // 4. Global circuit breaker
  const globalAllowed = await checkGlobalRateLimit()
  if (!globalAllowed) {
    log('warn', LOG_EVENT.TELEGRAM_GLOBAL_RATE_LIMIT, {
      updateId: update.update_id,
    })
    return NextResponse.json({ ok: true })
  }

  // 5. Return 200 immediately, process in background
  after(async () => {
    try {
      const bot = getBot()
      await bot.handleUpdate(update as Update)
    } catch (error) {
      log('error', LOG_EVENT.TELEGRAM_PROCESS_ERROR, {
        error: error instanceof Error ? error.message : 'Unknown error',
        updateId: update.update_id,
      })
    }
  })

  return NextResponse.json({ ok: true })
}
