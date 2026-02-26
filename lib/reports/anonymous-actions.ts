'use server'

import { z } from 'zod/v4'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { getClientIp } from '@/lib/utils'
import {
  consumeWithFallback,
  createLazyRateLimiter,
} from '@/lib/rate-limit-utils'
import { PERSONA_IDS } from '@/lib/constants/personas'
import {
  MAX_REPORT_CONTENT_LENGTH,
  generateShareToken,
} from '@/lib/reports/constants'
import { AUTH_ERROR } from '@/lib/auth/types'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'
import type { ActionResult } from '@/types/action'
import type { PersonaId } from '@/types/chat'

const ANON_REPORT_MAX_ATTEMPTS = 10
const ANON_REPORT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// In-memory fallback for when Redis is unavailable (serverless-scoped, best-effort)
const anonReportAttempts = new Map<string, number[]>()

const getAnonReportLimiter = createLazyRateLimiter({
  maxRequests: ANON_REPORT_MAX_ATTEMPTS,
  window: '1 h',
  prefix: 'ratelimit:anon-report:ip',
})

const createAnonymousReportSchema = z.object({
  persona: z.enum(PERSONA_IDS as [string, ...string[]]),
  content: z.string().trim().min(1).max(MAX_REPORT_CONTENT_LENGTH),
})

/**
 * Create a report for an anonymous web user.
 * Uses the service client to bypass RLS (no auth context).
 * Rate-limited by IP to prevent abuse.
 */
export async function createAnonymousReport(
  persona: PersonaId,
  content: string
): Promise<ActionResult<{ shareToken: string }>> {
  const headerList = await headers()
  const ip = getClientIp(headerList)

  const allowed = await consumeWithFallback(
    getAnonReportLimiter(),
    ip,
    anonReportAttempts,
    ANON_REPORT_WINDOW_MS,
    ANON_REPORT_MAX_ATTEMPTS
  )

  if (!allowed) {
    log('warn', LOG_EVENT.RATE_LIMIT_HIT, { type: 'anon-report' })
    return { success: false, error: AUTH_ERROR.RATE_LIMITED }
  }

  const parsed = createAnonymousReportSchema.safeParse({ persona, content })
  if (!parsed.success) return { success: false, error: AUTH_ERROR.VALIDATION }

  const shareToken = generateShareToken()
  const supabase = createServiceClient()

  const { error } = await supabase.from('reports').insert({
    persona: parsed.data.persona,
    content: parsed.data.content,
    share_token: shareToken,
    is_branded: true,
    is_anonymous: true,
  })

  if (error) {
    log('error', LOG_EVENT.ANONYMOUS_REPORT_FAILED, {
      persona: parsed.data.persona,
    })
    return { success: false, error: AUTH_ERROR.CREATE_FAILED }
  }

  return { success: true, shareToken }
}
