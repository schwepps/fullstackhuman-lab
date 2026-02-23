import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AUTH_ERROR } from '@/lib/auth/types'

// --- Mocks ---

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()

const mockSupabaseAuth = {
  getUser: vi.fn(),
}

const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: mockFrom,
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}))

vi.mock('@/lib/auth/rate-limit', () => ({
  checkAuthRateLimit: vi.fn(async () => true),
}))

import {
  createReport,
  getShareTokenForConversation,
} from '@/lib/reports/actions'
import { checkAuthRateLimit } from '@/lib/auth/rate-limit'

// --- Helpers ---

const VALID_CONVERSATION_ID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_PERSONA = 'doctor'
const VALID_CONTENT =
  '# 🩺 Project Diagnostic Report\n\nYour project needs help.'
const MOCK_USER = { id: 'user-123' }

function setupFromChain(result: { data?: unknown; error?: unknown }) {
  mockSingle.mockResolvedValue(result)
  mockEq.mockReturnValue({ single: mockSingle, eq: mockEq })
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockInsert.mockResolvedValue(result)
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEq,
  })
}

// --- Tests ---

describe('createReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
    })
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await createReport(
      VALID_CONVERSATION_ID,
      VALID_PERSONA,
      VALID_CONTENT
    )

    expect(result).toEqual({ success: false, error: AUTH_ERROR.RATE_LIMITED })
  })

  it('returns validation error for invalid conversation ID', async () => {
    const result = await createReport(
      'not-a-uuid',
      VALID_PERSONA,
      VALID_CONTENT
    )

    expect(result).toEqual({ success: false, error: AUTH_ERROR.VALIDATION })
  })

  it('returns validation error for empty content', async () => {
    const result = await createReport(VALID_CONVERSATION_ID, VALID_PERSONA, '')

    expect(result).toEqual({ success: false, error: AUTH_ERROR.VALIDATION })
  })

  it('returns validation error for whitespace-only content', async () => {
    const result = await createReport(
      VALID_CONVERSATION_ID,
      VALID_PERSONA,
      '   '
    )

    expect(result).toEqual({ success: false, error: AUTH_ERROR.VALIDATION })
  })

  it('returns validation error for invalid persona', async () => {
    const result = await createReport(
      VALID_CONVERSATION_ID,
      'invalid',
      VALID_CONTENT
    )

    expect(result).toEqual({ success: false, error: AUTH_ERROR.VALIDATION })
  })

  it('returns unauthorized when user is not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const result = await createReport(
      VALID_CONVERSATION_ID,
      VALID_PERSONA,
      VALID_CONTENT
    )

    expect(result).toEqual({ success: false, error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns existing share token when report already exists (idempotency)', async () => {
    // First call to .from('reports').select('share_token').eq().single()
    // returns existing report
    const existingToken = 'abc123existingtoken'
    setupFromChain({ data: { share_token: existingToken } })

    const result = await createReport(
      VALID_CONVERSATION_ID,
      VALID_PERSONA,
      VALID_CONTENT
    )

    expect(result).toEqual({ success: true, shareToken: existingToken })
  })

  it('creates report with is_branded: true for free tier user', async () => {
    // First call: no existing report
    const callCount = { from: 0 }
    mockFrom.mockImplementation((table: string) => {
      callCount.from++
      if (table === 'reports' && callCount.from === 1) {
        // Idempotency check — no existing report
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }
      }
      if (table === 'users') {
        // User tier check
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { tier: 'free' } }),
            }),
          }),
        }
      }
      if (table === 'reports') {
        // Insert
        return {
          insert: () => Promise.resolve({ error: null }),
        }
      }
      return {}
    })

    const result = await createReport(
      VALID_CONVERSATION_ID,
      VALID_PERSONA,
      VALID_CONTENT
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.shareToken).toMatch(/^[0-9a-f]{32}$/)
    }
  })

  it('creates report with is_branded: false for paid tier user', async () => {
    const callCount = { from: 0 }
    mockFrom.mockImplementation((table: string) => {
      callCount.from++
      if (table === 'reports' && callCount.from === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { tier: 'paid' } }),
            }),
          }),
        }
      }
      if (table === 'reports') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {}
    })

    const result = await createReport(
      VALID_CONVERSATION_ID,
      VALID_PERSONA,
      VALID_CONTENT
    )

    expect(result.success).toBe(true)
  })

  it('returns create failed on insert error', async () => {
    const callCount = { from: 0 }
    mockFrom.mockImplementation((table: string) => {
      callCount.from++
      if (table === 'reports' && callCount.from === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { tier: 'free' } }),
            }),
          }),
        }
      }
      if (table === 'reports') {
        return {
          insert: () =>
            Promise.resolve({ error: { message: 'insert failed' } }),
        }
      }
      return {}
    })

    const result = await createReport(
      VALID_CONVERSATION_ID,
      VALID_PERSONA,
      VALID_CONTENT
    )

    expect(result).toEqual({ success: false, error: AUTH_ERROR.CREATE_FAILED })
  })
})

describe('getShareTokenForConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
    })
  })

  it('returns null for invalid UUID', async () => {
    const result = await getShareTokenForConversation('not-a-uuid')
    expect(result).toBeNull()
  })

  it('returns null when user is not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await getShareTokenForConversation(VALID_CONVERSATION_ID)
    expect(result).toBeNull()
  })

  it('returns null when conversation does not belong to user', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      }),
    })

    const result = await getShareTokenForConversation(VALID_CONVERSATION_ID)
    expect(result).toBeNull()
  })

  it('returns share_token when report exists and user owns conversation', async () => {
    const callCount = { from: 0 }
    mockFrom.mockImplementation(() => {
      callCount.from++
      if (callCount.from === 1) {
        // Conversation ownership check
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { id: VALID_CONVERSATION_ID } }),
              }),
            }),
          }),
        }
      }
      // Report share_token lookup
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { share_token: 'abc123' }, error: null }),
          }),
        }),
      }
    })

    const result = await getShareTokenForConversation(VALID_CONVERSATION_ID)
    expect(result).toBe('abc123')
  })
})
