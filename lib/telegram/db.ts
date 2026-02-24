import { createServiceClient } from '@/lib/supabase/service'
import type { PersonaId, ChatMessage } from '@/types/chat'
import type {
  TelegramUserRow,
  TelegramConversationRow,
  TelegramConversationStatus,
} from '@/lib/telegram/types'

/**
 * Scoped service client module for Telegram bot DB access.
 *
 * This is the ONLY file that imports createServiceClient() for Telegram operations.
 * Every function: hardcoded table, hardcoded columns, no dynamic input in query structure.
 *
 * The service role client bypasses ALL RLS policies — keep queries minimal and scoped.
 */

// --- Telegram Users ---

export async function upsertTelegramUser(
  telegramId: number,
  languageCode: string
): Promise<TelegramUserRow | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('telegram_users')
    .upsert(
      {
        telegram_id: telegramId,
        language_code: languageCode,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' }
    )
    .select()
    .single()

  if (error) return null
  return data as TelegramUserRow
}

export async function getTelegramUserByTelegramId(
  telegramId: number
): Promise<TelegramUserRow | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('telegram_users')
    .select()
    .eq('telegram_id', telegramId)
    .single()

  if (error) return null
  return data as TelegramUserRow
}

export async function deleteTelegramUser(
  telegramUserId: string
): Promise<boolean> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('telegram_users')
    .delete()
    .eq('id', telegramUserId)

  return !error
}

// --- Telegram Conversations ---

export async function createTelegramConversation(params: {
  telegramUserId: string
  telegramChatId: number
  persona: PersonaId
}): Promise<string | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('telegram_conversations')
    .insert({
      telegram_user_id: params.telegramUserId,
      telegram_chat_id: params.telegramChatId,
      persona: params.persona,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return null
  return data.id
}

export async function getTelegramConversation(
  conversationId: string
): Promise<TelegramConversationRow | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('telegram_conversations')
    .select()
    .eq('id', conversationId)
    .single()

  if (error) return null
  return data as TelegramConversationRow
}

export async function updateTelegramConversationMessages(params: {
  conversationId: string
  messages: ChatMessage[]
  hasReport: boolean
  title: string | null
}): Promise<boolean> {
  const status: TelegramConversationStatus = params.hasReport
    ? 'completed'
    : 'active'

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('telegram_conversations')
    .update({
      messages: params.messages as unknown as Record<string, unknown>[],
      message_count: params.messages.length,
      has_report: params.hasReport,
      status,
      title: params.title,
    })
    .eq('id', params.conversationId)

  return !error
}

export async function abandonTelegramConversation(
  conversationId: string
): Promise<boolean> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('telegram_conversations')
    .update({ status: 'abandoned' as TelegramConversationStatus })
    .eq('id', conversationId)
    .eq('status', 'active')
    .is('has_report', false)

  return !error
}

/** Get the most recent active conversation for a chat */
export async function getActiveTelegramConversation(
  telegramChatId: number
): Promise<TelegramConversationRow | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('telegram_conversations')
    .select()
    .eq('telegram_chat_id', telegramChatId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as TelegramConversationRow
}

// --- Telegram Quota (via RPC) ---

export async function consumeTelegramConversation(
  telegramUserId: string
): Promise<{ allowed: boolean }> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('use_telegram_conversation', {
    p_telegram_user_id: telegramUserId,
  })

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return { allowed: false }
  }

  const result = Array.isArray(data) ? data[0] : data
  return { allowed: result.was_allowed }
}

// --- Telegram Reports ---

export async function createTelegramReport(params: {
  telegramConversationId: string
  persona: PersonaId
  content: string
  shareToken: string
}): Promise<{ success: boolean; shareToken?: string }> {
  const supabase = createServiceClient()

  // Idempotency: check if report already exists
  const { data: existing } = await supabase
    .from('reports')
    .select('share_token')
    .eq('telegram_conversation_id', params.telegramConversationId)
    .single()

  if (existing) {
    return { success: true, shareToken: existing.share_token }
  }

  const { error } = await supabase.from('reports').insert({
    telegram_conversation_id: params.telegramConversationId,
    persona: params.persona,
    content: params.content,
    share_token: params.shareToken,
    is_branded: true, // Telegram users are always free tier
  })

  if (error) {
    // Handle concurrent race: unique constraint violated → re-fetch
    if (error.code === '23505') {
      const { data: raceExisting } = await supabase
        .from('reports')
        .select('share_token')
        .eq('telegram_conversation_id', params.telegramConversationId)
        .single()

      if (raceExisting) {
        return { success: true, shareToken: raceExisting.share_token }
      }
    }
    return { success: false }
  }

  return { success: true, shareToken: params.shareToken }
}

// --- GDPR: Delete all data for a Telegram user ---

export async function deleteAllTelegramUserData(
  telegramId: number
): Promise<boolean> {
  const user = await getTelegramUserByTelegramId(telegramId)
  if (!user) return true // Nothing to delete

  // Conversations and reports cascade-delete via FK
  return deleteTelegramUser(user.id)
}
