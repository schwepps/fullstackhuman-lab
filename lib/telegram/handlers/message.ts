import type { Context } from 'telegraf'
import { fmt, bold, link } from 'telegraf/format'
import {
  getConversationState,
  clearConversationState,
} from '@/lib/telegram/state'
import { getTelegramConversation } from '@/lib/telegram/db'
import {
  callAI,
  detectReport,
  buildTelegramSystemBlocks,
} from '@/lib/telegram/services/ai-service'
import {
  saveMessages,
  extractTitle,
} from '@/lib/telegram/services/conversation-service'
import {
  createReport,
  buildShareUrl,
} from '@/lib/telegram/services/report-service'
import { sanitizeTelegramMessage } from '@/lib/telegram/sanitize'
import { convertToMarkdownV2, splitMessage } from '@/lib/telegram/format'
import { detectLanguage, t } from '@/lib/telegram/i18n'
import {
  NO_ACTIVE_CONVERSATION,
  CONVERSATION_LIMIT_REACHED,
  TURNS_REMAINING,
  AI_ERROR,
  REPORT_READY,
  VIEW_REPORT,
  BOOK_A_CALL,
  REPORT_CTA,
} from '@/lib/telegram/i18n'
import {
  getUserTurnCount,
  getConversationPhase,
  getRemainingTurns,
  truncateHistory,
  WRAP_UP_START_TURN,
} from '@/lib/ai/conversation-limits'
import {
  checkMessageRateLimit,
  checkDailyAiCallLimit,
} from '@/lib/telegram/services/quota-service'
import { DAILY_LIMIT_REACHED, MESSAGE_RATE_LIMITED } from '@/lib/telegram/i18n'
import { withTypingIndicator } from '@/lib/telegram/typing'
import { CALENDLY_URL } from '@/lib/constants/app'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'
import type { ChatMessage } from '@/types/chat'

/**
 * Handle incoming text messages during an active conversation.
 */
export async function handleMessage(ctx: Context): Promise<void> {
  if (!ctx.message || !('text' in ctx.message) || !ctx.message.from) return
  const chatId = ctx.message.chat.id
  const lang = detectLanguage(ctx.from?.language_code)

  // Sanitize input
  const sanitized = sanitizeTelegramMessage(ctx.message.text)
  if (!sanitized) return

  // Check per-message rate limit (flood protection)
  const messageAllowed = await checkMessageRateLimit(ctx.message.from.id)
  if (!messageAllowed) {
    await ctx.reply(t(MESSAGE_RATE_LIMITED, lang))
    return
  }

  // Check daily AI call limit
  const dailyAllowed = await checkDailyAiCallLimit(ctx.message.from.id)
  if (!dailyAllowed) {
    log('warn', LOG_EVENT.TELEGRAM_DAILY_LIMIT, { chatId })
    await ctx.reply(t(DAILY_LIMIT_REACHED, lang))
    return
  }

  // Retrieve conversation state
  const state = await getConversationState(chatId)
  if (!state) {
    await ctx.reply(t(NO_ACTIVE_CONVERSATION, lang))
    return
  }

  // Load existing messages from DB
  const conversation = await getTelegramConversation(state.conversationId)
  const existingMessages: ChatMessage[] = conversation?.messages ?? []

  // Build new user message
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: sanitized,
    isReport: false,
    timestamp: Date.now(),
  }

  // Build full messages array for AI
  const allMessages = [...existingMessages, userMessage]

  // Enforce conversation depth limit
  const turnCount = getUserTurnCount(allMessages.length)
  const phase = getConversationPhase(turnCount)

  if (phase === 'hard-cap') {
    log('info', LOG_EVENT.CONVERSATION_LIMIT_REACHED, {
      chatId,
      turnCount,
      conversationId: state.conversationId,
    })
    await ctx.reply(t(CONVERSATION_LIMIT_REACHED, lang))
    await clearConversationState(chatId)
    return
  }

  // Notify user once when entering wrap-up phase
  if (turnCount === WRAP_UP_START_TURN) {
    const remaining = getRemainingTurns(turnCount)
    const msg = t(TURNS_REMAINING, lang).replace('{count}', String(remaining))
    await ctx.reply(msg)
  }

  // Build system prompt blocks with cache_control for cost reduction
  let systemBlocks
  try {
    systemBlocks = await buildTelegramSystemBlocks(state.persona, turnCount)
  } catch (error) {
    log('error', LOG_EVENT.TELEGRAM_AI_ERROR, {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'prompt_assembly',
    })
    await ctx.reply(t(AI_ERROR, lang))
    return
  }

  // Truncate history for cost control
  const aiMessages = truncateHistory(
    allMessages.map((m) => ({ role: m.role, content: m.content }))
  )

  // Call AI (with typing indicator to show feedback during generation)
  const aiResponse = await withTypingIndicator(ctx, () =>
    callAI({ systemBlocks, messages: aiMessages })
  )

  if (!aiResponse) {
    await ctx.reply(t(AI_ERROR, lang))
    return
  }

  // Build assistant message
  const isReport = detectReport(aiResponse, state.persona)
  const assistantMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: aiResponse,
    isReport,
    timestamp: Date.now(),
  }

  const updatedMessages = [...allMessages, assistantMessage]

  if (isReport) {
    await handleReportDetected(ctx, state, updatedMessages, aiResponse, lang)
  } else {
    await handleRegularResponse(ctx, state, updatedMessages, aiResponse)
  }
}

async function handleReportDetected(
  ctx: Context,
  state: {
    conversationId: string
    persona: Parameters<typeof detectReport>[1]
    telegramUserId: string
  },
  messages: ChatMessage[],
  reportContent: string,
  lang: ReturnType<typeof detectLanguage>
): Promise<void> {
  // Create report
  const result = await createReport({
    telegramConversationId: state.conversationId,
    persona: state.persona,
    content: reportContent,
  })

  // Save messages as completed
  const title = extractTitle(messages)
  await saveMessages({
    conversationId: state.conversationId,
    messages,
    hasReport: true,
    title,
  })

  if (result.success && result.shareToken) {
    const shareUrl = buildShareUrl(result.shareToken, lang)

    await ctx.reply(
      fmt`${bold(t(REPORT_READY, lang))}\n\n${link(t(VIEW_REPORT, lang), shareUrl)}\n\n${t(REPORT_CTA, lang)}\n\n${link(t(BOOK_A_CALL, lang), CALENDLY_URL)}`
    )
  } else {
    log('error', LOG_EVENT.TELEGRAM_REPORT_CREATE_FAILED, {
      conversationId: state.conversationId,
    })
    // Still send the response as plain text since report creation failed
    const formatted = convertToMarkdownV2(reportContent)
    const chunks = splitMessage(formatted)
    for (const chunk of chunks) {
      await ctx.reply(chunk, { parse_mode: 'MarkdownV2' })
    }
  }

  // Clear conversation state (conversation is complete)
  const chatId = ctx.message?.chat.id ?? ctx.callbackQuery?.message?.chat.id
  if (chatId) {
    await clearConversationState(chatId)
  }
}

async function handleRegularResponse(
  ctx: Context,
  state: { conversationId: string },
  messages: ChatMessage[],
  aiResponse: string
): Promise<void> {
  // Save messages
  const title = extractTitle(messages)
  await saveMessages({
    conversationId: state.conversationId,
    messages,
    hasReport: false,
    title,
  })

  // Format and send AI response
  const formatted = convertToMarkdownV2(aiResponse)
  const chunks = splitMessage(formatted)
  for (const chunk of chunks) {
    await ctx.reply(chunk, { parse_mode: 'MarkdownV2' })
  }
}
