import crypto from 'crypto'

/** Max report content length (generous upper bound for AI-generated reports) */
export const MAX_REPORT_CONTENT_LENGTH = 50_000

/** Generate a URL-safe share token (32 hex chars, UUID without hyphens) */
export function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}
