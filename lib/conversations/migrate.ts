'use server'

import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { AUTH_ERROR } from '@/lib/auth/types'
import { checkAuthRateLimit } from '@/lib/auth/rate-limit'
import { PERSONA_IDS } from '@/lib/constants/personas'
import { extractTitle } from '@/lib/conversations/utils'
import type { PersonaId } from '@/types/chat'
import {
  CONVERSATION_STATUSES,
  type ConversationStatus,
} from '@/types/conversation'

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  isReport: z.boolean(),
  timestamp: z.number(),
})

const anonymousConversationSchema = z.object({
  id: z.string(),
  persona: z.enum(PERSONA_IDS as [string, ...string[]]),
  title: z.string().nullable(),
  messages: z.array(messageSchema).min(1),
  hasReport: z.boolean(),
  status: z.enum(CONVERSATION_STATUSES as unknown as [string, ...string[]]),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const migrateInputSchema = z.array(anonymousConversationSchema).max(10)

export async function migrateAnonymousConversations(
  rawConversations: unknown
): Promise<
  { success: true; count: number } | { success: false; error: string }
> {
  if (!(await checkAuthRateLimit())) {
    return { success: false, error: AUTH_ERROR.RATE_LIMITED }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: AUTH_ERROR.UNAUTHORIZED }

  const parsed = migrateInputSchema.safeParse(rawConversations)
  if (!parsed.success) return { success: false, error: AUTH_ERROR.VALIDATION }

  const conversations = parsed.data
  if (conversations.length === 0) return { success: true, count: 0 }

  const rows = conversations.map((conv) => ({
    user_id: user.id,
    persona: conv.persona as PersonaId,
    title: conv.title ?? extractTitle(conv.messages),
    messages: JSON.parse(JSON.stringify(conv.messages)),
    has_report: conv.hasReport,
    status: conv.status as ConversationStatus,
    message_count: conv.messages.length,
    created_at: new Date(conv.createdAt).toISOString(),
    updated_at: new Date(conv.updatedAt).toISOString(),
  }))

  const { error } = await supabase.from('conversations').insert(rows)
  if (error) return { success: false, error: AUTH_ERROR.MIGRATION_FAILED }

  return { success: true, count: rows.length }
}
