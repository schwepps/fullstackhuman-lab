import { headers } from 'next/headers'
import { getClientIp } from '@/lib/utils'
import {
  consumeWithFallback,
  createLazyRateLimiter,
} from '@/lib/rate-limit-utils'

const isDev = process.env.NODE_ENV === 'development'

const BOOKING_MAX_ATTEMPTS = 5
const BOOKING_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const SLOTS_MAX_REQUESTS = 30
const SLOTS_WINDOW_MS = 60 * 1000 // 1 minute

const bookingAttempts = new Map<string, number[]>()
const slotsRequests = new Map<string, number[]>()

const getBookingLimiter = createLazyRateLimiter({
  maxRequests: BOOKING_MAX_ATTEMPTS,
  window: '1 h',
  prefix: 'ratelimit:booking:ip',
})

const getSlotsLimiter = createLazyRateLimiter({
  maxRequests: SLOTS_MAX_REQUESTS,
  window: '1 m',
  prefix: 'ratelimit:slots:ip',
})

/**
 * Per-IP rate limiter for booking creation.
 * 5 bookings per hour per IP.
 */
export async function checkBookingRateLimit(): Promise<boolean> {
  if (isDev) return true
  const headerList = await headers()
  const ip = getClientIp(headerList)
  return consumeWithFallback(
    getBookingLimiter(),
    ip,
    bookingAttempts,
    BOOKING_WINDOW_MS,
    BOOKING_MAX_ATTEMPTS
  )
}

/**
 * Per-IP rate limiter for slot queries.
 * 30 requests per minute per IP.
 */
export async function checkSlotsRateLimit(): Promise<boolean> {
  const headerList = await headers()
  const ip = getClientIp(headerList)
  return consumeWithFallback(
    getSlotsLimiter(),
    ip,
    slotsRequests,
    SLOTS_WINDOW_MS,
    SLOTS_MAX_REQUESTS
  )
}
