'use server'

import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { AUTH_ERROR } from '@/lib/auth/types'
import { checkAuthRateLimit } from '@/lib/auth/rate-limit'
import { PERSONA_IDS } from '@/lib/constants/personas'
import { UUID_REGEX } from '@/lib/constants/validation'
import { extractTitle } from '@/lib/conversations/utils'
import { ALLOWED_FILE_TYPES, type ChatMessage } from '@/types/chat'
import { MAX_FILE_NAME_LENGTH } from '@/lib/constants/chat'
import type { ConversationStatus } from '@/types/conversation'
import type { ActionResult } from '@/types/action'

// --- Validation schemas ---

const attachmentMetaSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(MAX_FILE_NAME_LENGTH),
  type: z.enum(ALLOWED_FILE_TYPES),
  size: z.number().positive(),
})

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  isReport: z.boolean(),
  timestamp: z.number(),
  attachments: z.array(attachmentMetaSchema).optional(),
})

const createConversationSchema = z.object({
  persona: z.enum(PERSONA_IDS as [string, ...string[]]),
  messages: z.array(messageSchema).min(1),
})

const saveMessagesSchema = z.object({
  conversationId: z.string().regex(UUID_REGEX),
  messages: z.array(messageSchema).min(1),
  hasReport: z.boolean(),
})

// --- Actions ---

export async function createConversation(
  persona: string,
  messages: ChatMessage[]
): Promise<ActionResult<{ id: string }>> {
  if (!(await checkAuthRateLimit())) {
    return { success: false, error: AUTH_ERROR.RATE_LIMITED }
  }

  const parsed = createConversationSchema.safeParse({ persona, messages })
  if (!parsed.success) return { success: false, error: AUTH_ERROR.VALIDATION }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: AUTH_ERROR.UNAUTHORIZED }

  const title = extractTitle(parsed.data.messages)
  const hasReport = parsed.data.messages.some((m) => m.isReport)
  const status: ConversationStatus = hasReport ? 'completed' : 'active'

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      persona: parsed.data.persona,
      title,
      messages: parsed.data.messages,
      has_report: hasReport,
      status,
      message_count: parsed.data.messages.length,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: AUTH_ERROR.CREATE_FAILED }
  return { success: true, id: data.id }
}

export async function saveMessages(
  conversationId: string,
  messages: ChatMessage[],
  hasReport: boolean
): Promise<ActionResult> {
  if (!(await checkAuthRateLimit())) {
    return { success: false, error: AUTH_ERROR.RATE_LIMITED }
  }

  const parsed = saveMessagesSchema.safeParse({
    conversationId,
    messages,
    hasReport,
  })
  if (!parsed.success) return { success: false, error: AUTH_ERROR.VALIDATION }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: AUTH_ERROR.UNAUTHORIZED }

  const title = extractTitle(parsed.data.messages)
  const status: ConversationStatus = parsed.data.hasReport
    ? 'completed'
    : 'active'

  const { error } = await supabase
    .from('conversations')
    .update({
      messages: parsed.data.messages,
      has_report: parsed.data.hasReport,
      status,
      title,
      message_count: parsed.data.messages.length,
    })
    .eq('id', parsed.data.conversationId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: AUTH_ERROR.SAVE_FAILED }
  return { success: true }
}

export async function abandonConversation(
  conversationId: string
): Promise<ActionResult> {
  if (!(await checkAuthRateLimit())) {
    return { success: false, error: AUTH_ERROR.RATE_LIMITED }
  }

  if (!UUID_REGEX.test(conversationId)) {
    return { success: false, error: AUTH_ERROR.VALIDATION }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: AUTH_ERROR.UNAUTHORIZED }

  const { error } = await supabase
    .from('conversations')
    .update({ status: 'abandoned' as ConversationStatus })
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .is('has_report', false)

  if (error) return { success: false, error: AUTH_ERROR.UPDATE_FAILED }
  return { success: true }
}

export async function deleteConversation(
  conversationId: string
): Promise<ActionResult> {
  if (!(await checkAuthRateLimit())) {
    return { success: false, error: AUTH_ERROR.RATE_LIMITED }
  }

  if (!UUID_REGEX.test(conversationId)) {
    return { success: false, error: AUTH_ERROR.VALIDATION }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: AUTH_ERROR.UNAUTHORIZED }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: AUTH_ERROR.DELETE_FAILED }
  return { success: true }
}
