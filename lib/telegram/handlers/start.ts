import type { Context } from 'telegraf'
import { Markup } from 'telegraf'
import { getOrCreateTelegramUser } from '@/lib/telegram/services/user-service'
import { getConversationState } from '@/lib/telegram/state'
import { detectLanguage, t } from '@/lib/telegram/i18n'
import {
  WELCOME_MESSAGE,
  PRIVACY_NOTICE,
  PERSONA_BUTTON_LABELS,
  PERSONA_PICKER_PROMPT,
  ALREADY_IN_CONVERSATION,
} from '@/lib/telegram/i18n'
import { CALLBACK_PERSONA_PREFIX } from '@/lib/telegram/constants'
import { PERSONA_IDS } from '@/lib/constants/personas'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'

/**
 * Handle /start command.
 * Creates/updates user, checks for active conversation, shows persona picker.
 */
export async function handleStart(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id
  if (!telegramId || !ctx.chat) return

  const lang = detectLanguage(ctx.from?.language_code)
  const user = await getOrCreateTelegramUser(
    telegramId,
    ctx.from?.language_code
  )

  if (!user) {
    log('error', LOG_EVENT.TELEGRAM_START_USER_FAILED, { telegramId })
    return
  }

  // Warn if user already has an active conversation
  const existingState = await getConversationState(ctx.chat.id)
  if (existingState) {
    await ctx.reply(t(ALREADY_IN_CONVERSATION, lang))
    return
  }

  // Send welcome + privacy notice
  await ctx.reply(t(WELCOME_MESSAGE, lang))
  await ctx.reply(t(PRIVACY_NOTICE, lang))

  // Send inline keyboard with persona buttons
  const buttons = PERSONA_IDS.map((id) =>
    Markup.button.callback(
      t(PERSONA_BUTTON_LABELS[id], lang),
      `${CALLBACK_PERSONA_PREFIX}${id}`
    )
  )

  await ctx.reply(
    t(PERSONA_PICKER_PROMPT, lang),
    Markup.inlineKeyboard(buttons, { columns: 1 })
  )
}
