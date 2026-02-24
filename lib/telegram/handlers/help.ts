import type { Context } from 'telegraf'
import {
  getConversationState,
  clearConversationState,
} from '@/lib/telegram/state'
import { abandonConversation } from '@/lib/telegram/services/conversation-service'
import { deleteAllTelegramUserData } from '@/lib/telegram/db'
import { detectLanguage, t } from '@/lib/telegram/i18n'
import {
  HELP_MESSAGE,
  CONVERSATION_ABANDONED,
  NO_ACTIVE_CONVERSATION,
  DELETE_DATA_CONFIRM,
  DELETE_DATA_FAILED,
} from '@/lib/telegram/i18n'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'

/**
 * Handle /help command. Sends the list of available commands.
 */
export async function handleHelp(ctx: Context): Promise<void> {
  const lang = detectLanguage(ctx.from?.language_code)
  await ctx.reply(t(HELP_MESSAGE, lang))
}

/**
 * Handle /reset command. Abandons the active conversation and clears state.
 */
export async function handleReset(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id
  if (!chatId) return

  const lang = detectLanguage(ctx.from?.language_code)
  const state = await getConversationState(chatId)

  if (!state) {
    await ctx.reply(t(NO_ACTIVE_CONVERSATION, lang))
    return
  }

  await abandonConversation(state.conversationId)
  await clearConversationState(chatId)
  await ctx.reply(t(CONVERSATION_ABANDONED, lang))
}

/**
 * Handle /deletedata command. Deletes all user data (GDPR compliance).
 */
export async function handleDeleteData(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id
  const chatId = ctx.chat?.id
  if (!telegramId) return

  const lang = detectLanguage(ctx.from?.language_code)

  try {
    const success = await deleteAllTelegramUserData(telegramId)

    // Clear conversation state if chat context available
    if (chatId) {
      await clearConversationState(chatId)
    }

    if (success) {
      await ctx.reply(t(DELETE_DATA_CONFIRM, lang))
    } else {
      await ctx.reply(t(DELETE_DATA_FAILED, lang))
    }
  } catch (error) {
    log('error', LOG_EVENT.TELEGRAM_DELETE_DATA_FAILED, {
      telegramId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    await ctx.reply(t(DELETE_DATA_FAILED, lang))
  }
}
