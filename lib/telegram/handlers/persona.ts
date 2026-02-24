import type { Context } from 'telegraf'
import { PERSONA_IDS } from '@/lib/constants/personas'
import { CALLBACK_PERSONA_PREFIX } from '@/lib/telegram/constants'
import { consumeConversation } from '@/lib/telegram/services/quota-service'
import { getOrCreateTelegramUser } from '@/lib/telegram/services/user-service'
import { startConversation } from '@/lib/telegram/services/conversation-service'
import { assemblePrompt, callAI } from '@/lib/telegram/services/ai-service'
import { setConversationState } from '@/lib/telegram/state'
import { saveMessages } from '@/lib/telegram/services/conversation-service'
import { convertToMarkdownV2, splitMessage } from '@/lib/telegram/format'
import { detectLanguage, t } from '@/lib/telegram/i18n'
import { QUOTA_EXCEEDED, PERSONA_STARTING, AI_ERROR } from '@/lib/telegram/i18n'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'
import { checkDailyAiCallLimit } from '@/lib/telegram/services/quota-service'
import { DAILY_LIMIT_REACHED } from '@/lib/telegram/i18n'
import type { PersonaId, ChatMessage } from '@/types/chat'

/** Synthetic trigger texts that initiate each persona's flow */
const PERSONA_TRIGGERS: Record<PersonaId, string> = {
  doctor: 'My project is stuck',
  critic: 'I need a second opinion',
  guide: 'Just curious what you can do',
}

/**
 * Handle persona selection from inline keyboard callback.
 */
export async function handlePersonaSelection(ctx: Context): Promise<void> {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return
  const from = ctx.callbackQuery.from
  const chat = ctx.callbackQuery.message?.chat
  if (!chat) return

  // Extract and validate persona
  const raw = ctx.callbackQuery.data?.replace(CALLBACK_PERSONA_PREFIX, '')
  const persona = PERSONA_IDS.find((id) => id === raw)
  if (!persona) return

  const lang = detectLanguage(from.language_code)

  // Dismiss loading spinner immediately
  await ctx.answerCbQuery()

  // Get or create user
  const user = await getOrCreateTelegramUser(from.id, from.language_code)
  if (!user) {
    log('error', LOG_EVENT.TELEGRAM_PERSONA_USER_FAILED, {
      telegramId: from.id,
    })
    return
  }

  // Check conversation quota
  const { allowed } = await consumeConversation(user.id)
  if (!allowed) {
    await ctx.reply(t(QUOTA_EXCEEDED, lang))
    return
  }

  // Start conversation in DB
  const conversationId = await startConversation({
    telegramUserId: user.id,
    telegramChatId: chat.id,
    persona,
  })
  if (!conversationId) {
    log('error', LOG_EVENT.TELEGRAM_PERSONA_CONV_FAILED, {
      telegramId: from.id,
    })
    await ctx.reply(t(AI_ERROR, lang))
    return
  }

  // Assemble system prompt and store state
  const systemPrompt = await assemblePrompt(persona)
  await setConversationState(chat.id, {
    conversationId,
    persona,
    systemPrompt,
    telegramUserId: user.id,
  })

  await ctx.reply(t(PERSONA_STARTING[persona], lang))

  // Check daily AI call limit before first AI call
  const dailyAllowed = await checkDailyAiCallLimit(from.id)
  if (!dailyAllowed) {
    await ctx.reply(t(DAILY_LIMIT_REACHED, lang))
    return
  }

  // First AI call with synthetic trigger
  const triggerText = PERSONA_TRIGGERS[persona]
  const aiResponse = await callAI({
    systemPrompt,
    messages: [{ role: 'user', content: triggerText }],
  })

  if (!aiResponse) {
    await ctx.reply(t(AI_ERROR, lang))
    return
  }

  // Save trigger + AI response
  const messages: ChatMessage[] = [
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: triggerText,
      isReport: false,
      timestamp: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiResponse,
      isReport: false,
      timestamp: Date.now(),
    },
  ]
  await saveMessages({
    conversationId,
    messages,
    hasReport: false,
    title: null,
  })

  // Send AI response formatted for Telegram
  const formatted = convertToMarkdownV2(aiResponse)
  const chunks = splitMessage(formatted)
  for (const chunk of chunks) {
    await ctx.reply(chunk, { parse_mode: 'MarkdownV2' })
  }
}
