import crypto from 'crypto'
import { createTelegramReport } from '@/lib/telegram/db'
import { buildReportShareUrl } from '@/lib/constants/reports'
import type { PersonaId } from '@/types/chat'
import type { TelegramLanguage } from '@/lib/telegram/types'

/**
 * Generate a URL-safe share token (32 hex chars, UUID without hyphens).
 */
export function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

/**
 * Create a report for a completed Telegram conversation.
 * Generates a share token and persists the report in the database.
 * Returns the share token on success or undefined on failure.
 */
export async function createReport(params: {
  telegramConversationId: string
  persona: PersonaId
  content: string
}): Promise<{ success: boolean; shareToken?: string }> {
  const shareToken = generateShareToken()

  return createTelegramReport({
    telegramConversationId: params.telegramConversationId,
    persona: params.persona,
    content: params.content,
    shareToken,
  })
}

/**
 * Build a locale-aware public share URL for a Telegram report.
 */
export function buildShareUrl(
  token: string,
  language: TelegramLanguage
): string {
  return buildReportShareUrl(token, language)
}
