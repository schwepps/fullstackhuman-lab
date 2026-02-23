import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AUTH_ERROR } from '@/lib/auth/types'

// --- Mocks ---

const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()

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

import { deleteConversation } from '@/lib/conversations/actions'
import { checkAuthRateLimit } from '@/lib/auth/rate-limit'

// --- Helpers ---

const VALID_CONVERSATION_ID = '550e8400-e29b-41d4-a716-446655440000'
const MOCK_USER = { id: 'user-123' }

// --- Tests ---

describe('deleteConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
    })
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await deleteConversation(VALID_CONVERSATION_ID)

    expect(result).toEqual({ success: false, error: AUTH_ERROR.RATE_LIMITED })
  })

  it('returns validation error for invalid UUID', async () => {
    const result = await deleteConversation('not-a-uuid')

    expect(result).toEqual({ success: false, error: AUTH_ERROR.VALIDATION })
  })

  it('returns unauthorized when user is not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const result = await deleteConversation(VALID_CONVERSATION_ID)

    expect(result).toEqual({ success: false, error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns success when conversation is deleted', async () => {
    mockEq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockDelete.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })

    const result = await deleteConversation(VALID_CONVERSATION_ID)

    expect(result).toEqual({ success: true })
    expect(mockFrom).toHaveBeenCalledWith('conversations')
  })

  it('returns delete failed on database error', async () => {
    mockEq.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
    })
    mockDelete.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })

    const result = await deleteConversation(VALID_CONVERSATION_ID)

    expect(result).toEqual({ success: false, error: AUTH_ERROR.DELETE_FAILED })
  })
})
