import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AUTH_ERROR, AUTH_SUCCESS } from '@/lib/auth/types'

// --- Mocks ---

const mockSupabaseAuth = {
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}

const mockSupabaseClient = { auth: mockSupabaseAuth }

const mockServiceAuth = {
  admin: {
    deleteUser: vi.fn(),
  },
}

const mockServiceClient = { auth: mockServiceAuth }

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}))

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockServiceClient),
}))

vi.mock('@/lib/auth/rate-limit', () => ({
  checkAuthRateLimit: vi.fn(async () => true),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import {
  changePasswordAction,
  changeEmailAction,
  deleteAccountAction,
} from '@/lib/auth/account-actions'
import { checkAuthRateLimit } from '@/lib/auth/rate-limit'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// --- Helpers ---

function toFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value)
  }
  return fd
}

const CURRENT_PASSWORD = 'OldPass1'
const NEW_PASSWORD = 'NewPass2'
const VALID_EMAIL = 'user@example.com'
const USER_ID = 'user-123'

function mockAuthenticatedUser(overrides?: Record<string, unknown>) {
  const user = {
    id: USER_ID,
    email: VALID_EMAIL,
    identities: [{ provider: 'email' }],
    ...overrides,
  }
  mockSupabaseAuth.getUser.mockResolvedValue({ data: { user } })
  return user
}

function mockReauthSuccess() {
  mockAuthenticatedUser()
  mockSupabaseAuth.signInWithPassword.mockResolvedValue({
    data: { user: { id: USER_ID }, session: {} },
    error: null,
  })
}

// --- Tests ---

describe('changePasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.RATE_LIMITED })
    expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled()
  })

  it('returns same password error when new matches current', async () => {
    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: CURRENT_PASSWORD,
        confirmPassword: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.SAME_PASSWORD })
  })

  it('returns passwords dont match error when confirm differs', async () => {
    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: 'Mismatch3',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.PASSWORDS_DONT_MATCH })
  })

  it('returns validation error for weak new password', async () => {
    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: 'short',
        confirmPassword: 'short',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns validation error for empty current password', async () => {
    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: '',
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns unauthorized error when no user session exists', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns unauthorized error for OAuth-only user (no email identity)', async () => {
    mockAuthenticatedUser({
      identities: [{ provider: 'google' }],
    })

    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns unauthorized error when user has no identities', async () => {
    mockAuthenticatedUser({ identities: [] })

    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns wrong password error when current password is incorrect', async () => {
    mockAuthenticatedUser()
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: 'WrongPass1',
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.WRONG_PASSWORD })
  })

  it('returns update failed error when updateUser fails', async () => {
    mockReauthSuccess()
    mockSupabaseAuth.updateUser.mockResolvedValue({
      error: { message: 'Password update failed' },
    })

    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UPDATE_FAILED })
  })

  it('returns success and invalidates other sessions on password change', async () => {
    mockReauthSuccess()
    mockSupabaseAuth.updateUser.mockResolvedValue({ error: null })
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

    const result = await changePasswordAction(
      null,
      toFormData({
        currentPassword: CURRENT_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    )

    expect(result).toEqual({ success: AUTH_SUCCESS.PASSWORD_CHANGED })
    expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
      password: NEW_PASSWORD,
    })
    expect(mockSupabaseAuth.signOut).toHaveBeenCalledWith({ scope: 'others' })
  })
})

describe('changeEmailAction', () => {
  const NEW_EMAIL = 'new@example.com'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await changeEmailAction(
      null,
      toFormData({
        email: NEW_EMAIL,
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.RATE_LIMITED })
  })

  it('returns validation error for invalid email', async () => {
    const result = await changeEmailAction(
      null,
      toFormData({
        email: 'not-email',
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns validation error for empty password', async () => {
    const result = await changeEmailAction(
      null,
      toFormData({
        email: NEW_EMAIL,
        password: '',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns unauthorized error when no user session exists', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await changeEmailAction(
      null,
      toFormData({
        email: NEW_EMAIL,
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns unauthorized error for OAuth-only user', async () => {
    mockAuthenticatedUser({
      identities: [{ provider: 'github' }],
    })

    const result = await changeEmailAction(
      null,
      toFormData({
        email: NEW_EMAIL,
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns wrong password error when password is incorrect', async () => {
    mockAuthenticatedUser()
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await changeEmailAction(
      null,
      toFormData({
        email: NEW_EMAIL,
        password: 'WrongPass1',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.WRONG_PASSWORD })
  })

  it('returns email update failed error when updateUser fails', async () => {
    mockReauthSuccess()
    mockSupabaseAuth.updateUser.mockResolvedValue({
      error: { message: 'Email update failed' },
    })

    const result = await changeEmailAction(
      null,
      toFormData({
        email: NEW_EMAIL,
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.EMAIL_UPDATE_FAILED })
  })

  it('returns success on email change', async () => {
    mockReauthSuccess()
    mockSupabaseAuth.updateUser.mockResolvedValue({ error: null })

    const result = await changeEmailAction(
      null,
      toFormData({
        email: NEW_EMAIL,
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ success: AUTH_SUCCESS.EMAIL_CONFIRMATION_SENT })
    expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
      email: NEW_EMAIL,
    })
  })
})

describe('deleteAccountAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await deleteAccountAction(
      null,
      toFormData({
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.RATE_LIMITED })
  })

  it('returns validation error for empty password', async () => {
    const result = await deleteAccountAction(
      null,
      toFormData({
        password: '',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns unauthorized error when no user session exists', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } })

    const result = await deleteAccountAction(
      null,
      toFormData({
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns unauthorized error for OAuth-only user', async () => {
    mockAuthenticatedUser({
      identities: [{ provider: 'google' }],
    })

    const result = await deleteAccountAction(
      null,
      toFormData({
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns wrong password error when password is incorrect', async () => {
    mockAuthenticatedUser()
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await deleteAccountAction(
      null,
      toFormData({
        password: 'WrongPass1',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.WRONG_PASSWORD })
  })

  it('returns delete failed error when admin deleteUser fails', async () => {
    mockReauthSuccess()
    mockServiceAuth.admin.deleteUser.mockResolvedValue({
      error: { message: 'Delete failed' },
    })

    const result = await deleteAccountAction(
      null,
      toFormData({
        password: CURRENT_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.DELETE_FAILED })
  })

  it('deletes user, signs out, and redirects on success', async () => {
    mockReauthSuccess()
    mockServiceAuth.admin.deleteUser.mockResolvedValue({ error: null })
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

    await deleteAccountAction(
      null,
      toFormData({
        password: CURRENT_PASSWORD,
      })
    )

    expect(mockServiceAuth.admin.deleteUser).toHaveBeenCalledWith(USER_ID)
    expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('uses service client for deletion, not regular client', async () => {
    mockReauthSuccess()
    mockServiceAuth.admin.deleteUser.mockResolvedValue({ error: null })
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

    await deleteAccountAction(
      null,
      toFormData({
        password: CURRENT_PASSWORD,
      })
    )

    // The service client admin.deleteUser is called, not regular client
    expect(mockServiceAuth.admin.deleteUser).toHaveBeenCalledTimes(1)
  })
})
