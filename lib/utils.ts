import { clsx, type ClassValue } from 'clsx'
import { createHash } from 'crypto'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract client IP from request headers (x-forwarded-for → x-real-ip → 'unknown'). */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}

const IP_HASH_SALT = process.env.LOG_HASH_SALT ?? 'fsh-log-salt-default'

/**
 * One-way hash of an IP address for privacy-safe logging.
 * Returns a 12-char hex prefix — enough to correlate requests
 * from the same IP without storing the raw address.
 *
 * Salt is read from LOG_HASH_SALT env var. In production, set this
 * to a secret value so IP hashes cannot be reversed from source code.
 */
export function hashIp(ip: string): string {
  return createHash('sha256')
    .update(ip + IP_HASH_SALT)
    .digest('hex')
    .slice(0, 12)
}
