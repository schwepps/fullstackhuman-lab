import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}))

import { getReportByToken } from '@/lib/reports/queries'

// --- Helpers ---

const MOCK_REPORT_ROW = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  conversation_id: '660f9500-f3ac-52e5-b827-557766551111',
  persona: 'doctor' as const,
  content: '# 🩺 Project Diagnostic Report\n\nFindings here.',
  share_token: 'abc123def456abc123def456abc123de',
  is_branded: true,
  created_at: '2026-02-23T10:00:00Z',
}

// --- Tests ---

describe('getReportByToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSingle.mockResolvedValue({ data: null, error: null })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  it('returns null when no report found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

    const result = await getReportByToken('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null on error', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'db error' },
    })

    const result = await getReportByToken('token')
    expect(result).toBeNull()
  })

  it('maps snake_case row to camelCase Report', async () => {
    mockSingle.mockResolvedValue({ data: MOCK_REPORT_ROW, error: null })

    const result = await getReportByToken(MOCK_REPORT_ROW.share_token)

    expect(result).toEqual({
      id: MOCK_REPORT_ROW.id,
      conversationId: MOCK_REPORT_ROW.conversation_id,
      persona: MOCK_REPORT_ROW.persona,
      content: MOCK_REPORT_ROW.content,
      shareToken: MOCK_REPORT_ROW.share_token,
      isBranded: true,
      createdAt: MOCK_REPORT_ROW.created_at,
    })
  })

  it('maps is_branded: false correctly', async () => {
    mockSingle.mockResolvedValue({
      data: { ...MOCK_REPORT_ROW, is_branded: false },
      error: null,
    })

    const result = await getReportByToken(MOCK_REPORT_ROW.share_token)
    expect(result?.isBranded).toBe(false)
  })
})
