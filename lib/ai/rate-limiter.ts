import { cookies } from 'next/headers'
import {
  RATE_LIMIT_COOKIE_NAME,
  RATE_LIMIT_COOKIE_MAX_AGE_SECONDS,
  MAX_REQUESTS_PER_IP_PER_HOUR,
  IP_WINDOW_MS,
} from '@/lib/constants/chat'
import { CONSENT_COOKIE_NAME } from '@/lib/constants/legal'
import {
  consumeWithFallback,
  createLazyRateLimiter,
} from '@/lib/rate-limit-utils'
import { TIER_QUOTAS, type UserTier, USER_TIERS } from '@/lib/constants/quotas'
import { createClient } from '@/lib/supabase/server'
import type { QuotaInfo } from '@/types/user'

export interface RateLimitResult extends QuotaInfo {
  allowed: boolean
}

// --- Anonymous rate limiting (cookie-based) ---
// Trade-off: cookie-based quota can be bypassed by clearing cookies / incognito.
// The IP rate limiter below provides a secondary defense layer.

// In-memory fallback for when Redis is unavailable (local dev, Upstash outage)
const ipRequestCounts = new Map<string, number[]>()

const getChatIpLimiter = createLazyRateLimiter({
  maxRequests: MAX_REQUESTS_PER_IP_PER_HOUR,
  window: '1 h',
  prefix: 'ratelimit:chat:ip',
})

function getConversationTimestamps(cookieValue: string | undefined): number[] {
  if (!cookieValue) return []
  try {
    const parsed: unknown = JSON.parse(cookieValue)
    if (!Array.isArray(parsed)) return []
    const oneDayAgo = Date.now() - RATE_LIMIT_COOKIE_MAX_AGE_SECONDS * 1000
    return parsed.filter(
      (ts: unknown) => typeof ts === 'number' && ts > oneDayAgo
    )
  } catch {
    return []
  }
}

/**
 * Check and record an IP request.
 * Returns true if the request is allowed, false if rate-limited.
 * Uses Upstash Redis with in-memory fallback.
 */
export async function consumeIpRequest(ip: string): Promise<boolean> {
  return consumeWithFallback(
    getChatIpLimiter(),
    ip,
    ipRequestCounts,
    IP_WINDOW_MS,
    MAX_REQUESTS_PER_IP_PER_HOUR
  )
}

export async function checkAnonymousRateLimit(): Promise<RateLimitResult> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(RATE_LIMIT_COOKIE_NAME)
  const timestamps = getConversationTimestamps(cookie?.value)
  const limit = TIER_QUOTAS.anonymous.maxConversationsPerDay
  const remaining = Math.max(0, limit - timestamps.length)
  return {
    allowed: timestamps.length < limit,
    remaining,
    limit,
    tier: 'anonymous',
    period: 'day',
  }
}

export async function recordAnonymousConversation(): Promise<void> {
  const cookieStore = await cookies()

  // GDPR: only set the tracking cookie if the user has granted consent
  const consent = cookieStore.get(CONSENT_COOKIE_NAME)?.value
  if (consent !== 'granted') return

  const cookie = cookieStore.get(RATE_LIMIT_COOKIE_NAME)
  const timestamps = getConversationTimestamps(cookie?.value)
  timestamps.push(Date.now())

  cookieStore.set(RATE_LIMIT_COOKIE_NAME, JSON.stringify(timestamps), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: RATE_LIMIT_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  })
}

// --- Authenticated rate limiting (DB-based, atomic via RPC) ---

function isValidTier(tier: unknown): tier is UserTier {
  return typeof tier === 'string' && USER_TIERS.includes(tier as UserTier)
}

/**
 * Read-only rate limit check for authenticated users.
 * Used by the quota API endpoint to display remaining quota.
 * Does NOT consume a conversation — use consumeAuthenticatedConversation() for that.
 */
export async function checkAuthenticatedRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('tier, conversation_count_month, conversation_count_reset_at')
    .eq('id', userId)
    .single()

  if (!profile || !isValidTier(profile.tier)) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      tier: 'free',
      period: 'month',
    }
  }

  const tier = profile.tier
  const quotas = TIER_QUOTAS[tier]

  // Paid users: unlimited
  if (quotas.maxConversationsPerMonth === null) {
    return {
      allowed: true,
      remaining: null,
      limit: null,
      tier,
      period: 'month',
    }
  }

  // Account for monthly reset when reading
  const resetAt = new Date(profile.conversation_count_reset_at)
  const monthlyCount =
    resetAt <= new Date() ? 0 : profile.conversation_count_month
  const limit = quotas.maxConversationsPerMonth
  const remaining = Math.max(0, limit - monthlyCount)

  return {
    allowed: monthlyCount < limit,
    remaining,
    limit,
    tier,
    period: 'month',
  }
}

/**
 * Atomically check and consume one conversation for an authenticated user.
 * Uses the use_conversation() PostgreSQL function with row-level locking
 * to prevent race conditions. Tier-to-limit mapping is resolved inside
 * the SQL function under the same lock to prevent TOCTOU races.
 */
export async function consumeAuthenticatedConversation(
  userId: string
): Promise<{ allowed: boolean }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('use_conversation', {
    p_user_id: userId,
  })

  if (error || !data || data.length === 0) {
    return { allowed: false }
  }

  return { allowed: data[0].was_allowed }
}
