'use server'

import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { AUTH_ERROR } from '@/lib/auth/types'
import { checkAuthRateLimit } from '@/lib/auth/rate-limit'
import { PERSONA_IDS } from '@/lib/constants/personas'
import { UUID_REGEX } from '@/lib/constants/validation'
import type { ActionResult } from '@/types/action'
import type { PersonaId } from '@/types/chat'

/** Max report content length (generous upper bound for AI-generated reports) */
const MAX_REPORT_CONTENT_LENGTH = 50_000

const createReportSchema = z.object({
  conversationId: z.string().regex(UUID_REGEX),
  persona: z.enum(PERSONA_IDS as [string, ...string[]]),
  content: z.string().trim().min(1).max(MAX_REPORT_CONTENT_LENGTH),
})

/**
 * Create a report row for an authenticated user's conversation.
 * Idempotent: if a report already exists for this conversation,
 * returns the existing share_token without creating a duplicate.
 */
export async function createReport(
  conversationId: string,
  persona: PersonaId,
  content: string
): Promise<ActionResult<{ shareToken: string }>> {
  if (!(await checkAuthRateLimit())) {
    return { success: false, error: AUTH_ERROR.RATE_LIMITED }
  }

  const parsed = createReportSchema.safeParse({
    conversationId,
    persona,
    content,
  })
  if (!parsed.success) return { success: false, error: AUTH_ERROR.VALIDATION }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: AUTH_ERROR.UNAUTHORIZED }

  // Idempotency: return existing report if already created
  const { data: existing } = await supabase
    .from('reports')
    .select('share_token')
    .eq('conversation_id', parsed.data.conversationId)
    .single()

  if (existing) {
    return { success: true, shareToken: existing.share_token }
  }

  // Resolve user tier to set is_branded
  const { data: userRow } = await supabase
    .from('users')
    .select('tier')
    .eq('id', user.id)
    .single()

  const isBranded = userRow?.tier !== 'paid'

  // Generate share token (UUID without hyphens = 32 alphanumeric chars)
  const shareToken = crypto.randomUUID().replace(/-/g, '')

  const { error } = await supabase.from('reports').insert({
    conversation_id: parsed.data.conversationId,
    persona: parsed.data.persona,
    content: parsed.data.content,
    share_token: shareToken,
    is_branded: isBranded,
  })

  if (error) return { success: false, error: AUTH_ERROR.CREATE_FAILED }
  return { success: true, shareToken }
}

/**
 * Fetch the share_token for a conversation's report (if one exists).
 * Server action callable from client components (unlike queries.ts which uses cookies()).
 */
export async function getShareTokenForConversation(
  conversationId: string
): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reports')
    .select('share_token')
    .eq('conversation_id', conversationId)
    .single()

  if (error || !data) return null
  return data.share_token
}
