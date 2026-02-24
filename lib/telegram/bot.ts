import { Telegraf } from 'telegraf'
import { handleStart } from '@/lib/telegram/handlers/start'
import { handlePersonaSelection } from '@/lib/telegram/handlers/persona'
import { handleMessage } from '@/lib/telegram/handlers/message'
import {
  handleHelp,
  handleReset,
  handleDeleteData,
} from '@/lib/telegram/handlers/help'
import { detectLanguage, t, AI_ERROR } from '@/lib/telegram/i18n'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'

let bot: Telegraf | null = null

/**
 * Get the Telegraf bot singleton. Lazily initialized on first call.
 * Registers all command handlers, callback queries, and the text catch-all.
 */
export function getBot(): Telegraf {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')

    bot = new Telegraf(token)
    registerHandlers(bot)
  }
  return bot
}

function registerHandlers(instance: Telegraf): void {
  // Commands
  instance.command('start', handleStart)
  instance.command('help', handleHelp)
  instance.command('reset', handleReset)
  instance.command('deletedata', handleDeleteData)

  // Persona selection callback
  instance.action(/^persona:/, handlePersonaSelection)

  // Text messages (catch-all, must be last)
  instance.on('text', handleMessage)

  // Global error handler
  instance.catch((error, ctx) => {
    log('error', LOG_EVENT.TELEGRAM_BOT_ERROR, {
      error: error instanceof Error ? error.message : 'Unknown error',
      chatId: ctx.chat?.id,
      updateType: ctx.updateType,
    })

    // Best-effort error reply
    const lang = detectLanguage(ctx.from?.language_code)
    ctx.reply(t(AI_ERROR, lang)).catch(() => {
      // Ignore reply failure in error handler
    })
  })
}
