import { cookies } from 'next/headers'
import {
  RATE_LIMIT_COOKIE_NAME,
  MAX_CONVERSATIONS_PER_DAY,
  RATE_LIMIT_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/constants/chat'

interface RateLimitResult {
  allowed: boolean
  remaining: number
}

// Server-side in-memory rate limit store (per-IP, sliding window).
// Supplements the cookie-based tracking for defense in depth.
// NOTE: On serverless platforms (e.g., Vercel), each function instance has its own
// Map. Cold starts reset the counter. For stronger enforcement, migrate to an
// edge-compatible store (Vercel KV, Upstash Redis).
const ipRequestCounts = new Map<string, number[]>()
const MAX_REQUESTS_PER_IP_PER_HOUR = 60
const IP_WINDOW_MS = 60 * 60 * 1000 // 1 hour

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

export function checkIpRateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - IP_WINDOW_MS
  const timestamps = ipRequestCounts.get(ip) ?? []
  const recent = timestamps.filter((ts) => ts > cutoff)
  if (recent.length === 0) {
    ipRequestCounts.delete(ip)
  } else {
    ipRequestCounts.set(ip, recent)
  }
  return recent.length < MAX_REQUESTS_PER_IP_PER_HOUR
}

export function recordIpRequest(ip: string): void {
  const now = Date.now()
  const cutoff = now - IP_WINDOW_MS
  const timestamps = ipRequestCounts.get(ip) ?? []
  const recent = timestamps.filter((ts) => ts > cutoff)
  recent.push(now)
  ipRequestCounts.set(ip, recent)
}

export async function checkRateLimit(): Promise<RateLimitResult> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(RATE_LIMIT_COOKIE_NAME)
  const timestamps = getConversationTimestamps(cookie?.value)
  const remaining = Math.max(0, MAX_CONVERSATIONS_PER_DAY - timestamps.length)
  return { allowed: timestamps.length < MAX_CONVERSATIONS_PER_DAY, remaining }
}

export async function recordConversationStart(): Promise<void> {
  const cookieStore = await cookies()
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
