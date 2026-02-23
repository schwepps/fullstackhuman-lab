import { createClient } from '@/lib/supabase/server'
import {
  RECENT_CONVERSATIONS_LIMIT,
  CONVERSATIONS_PAGE_SIZE,
} from '@/lib/constants/conversations'
import type { PersonaId, ChatMessage } from '@/types/chat'
import type {
  Conversation,
  ConversationSummary,
  ConversationStatus,
} from '@/types/conversation'

// Database row shape (snake_case from Supabase)
interface ConversationRow {
  id: string
  user_id: string
  persona: PersonaId
  title: string | null
  messages: ChatMessage[]
  has_report: boolean
  status: ConversationStatus
  message_count: number
  created_at: string
  updated_at: string
}

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    persona: row.persona,
    title: row.title,
    messages: row.messages,
    hasReport: row.has_report,
    status: row.status,
    messageCount: row.message_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface ReportRef {
  share_token: string
}

interface SummaryRow extends Omit<ConversationRow, 'messages' | 'user_id'> {
  // PostgREST returns object for 1-to-1 (UNIQUE FK) but TS client infers array
  reports: ReportRef | ReportRef[] | null
}

function extractShareToken(
  reports: ReportRef | ReportRef[] | null
): string | null {
  if (!reports) return null
  if (Array.isArray(reports)) return reports[0]?.share_token ?? null
  return reports.share_token ?? null
}

function toSummary(row: SummaryRow): ConversationSummary {
  return {
    id: row.id,
    persona: row.persona,
    title: row.title,
    hasReport: row.has_report,
    shareToken: extractShareToken(row.reports),
    status: row.status,
    messageCount: row.message_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SUMMARY_COLUMNS =
  'id, persona, title, has_report, status, message_count, created_at, updated_at, reports(share_token)' as const

export async function getRecentConversations(
  limit = RECENT_CONVERSATIONS_LIMIT
): Promise<ConversationSummary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('conversations')
    .select(SUMMARY_COLUMNS)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data.map(toSummary)
}

export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return toConversation(data as ConversationRow)
}

export type ConversationFilter = 'all' | 'reports' | 'drafts'

export async function getUserConversations(options?: {
  cursor?: string
  limit?: number
  filter?: ConversationFilter
}): Promise<{ items: ConversationSummary[]; nextCursor: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { items: [], nextCursor: null }

  const limit = options?.limit ?? CONVERSATIONS_PAGE_SIZE
  const filter = options?.filter ?? 'all'

  let query = supabase
    .from('conversations')
    .select(SUMMARY_COLUMNS)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit + 1) // Fetch one extra to determine if there's a next page

  if (filter === 'reports') {
    query = query.eq('has_report', true)
  } else if (filter === 'drafts') {
    query = query.eq('has_report', false)
  }

  if (options?.cursor) {
    query = query.lt('updated_at', options.cursor)
  }

  const { data, error } = await query

  if (error || !data) return { items: [], nextCursor: null }

  const hasMore = data.length > limit
  const items = (hasMore ? data.slice(0, limit) : data).map(toSummary)
  const nextCursor = hasMore ? items[items.length - 1].updatedAt : null

  return { items, nextCursor }
}
