import { createClient } from '@/lib/supabase/server'
import type { Report, ReportRow } from '@/types/report'

/** Supabase SELECT columns for public report page queries */
const REPORT_PUBLIC_COLUMNS =
  'id, conversation_id, persona, content, share_token, is_branded, created_at' as const

function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    persona: row.persona,
    content: row.content,
    shareToken: row.share_token,
    isBranded: row.is_branded,
    createdAt: row.created_at,
  }
}

/**
 * Fetch a report by its share_token for the public page.
 * No auth required — the RLS policy allows anon SELECT.
 */
export async function getReportByToken(
  shareToken: string
): Promise<Report | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_PUBLIC_COLUMNS)
    .eq('share_token', shareToken)
    .single()

  if (error || !data) return null
  return toReport(data as ReportRow)
}
