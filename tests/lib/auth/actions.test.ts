import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AUTH_ERROR, AUTH_SUCCESS } from '@/lib/auth/types'
import { APP_URL } from '@/lib/constants/app'

// --- Mocks ---

const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signOut: vi.fn(),
}

const mockSupabaseClient = { auth: mockSupabaseAuth }

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
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
  loginAction,
  signupAction,
  forgotPasswordAction,
  resetPasswordAction,
  logoutAction,
} from '@/lib/auth/actions'
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

const VALID_PASSWORD = 'Passw0rd'
const VALID_EMAIL = 'user@example.com'

// --- Tests ---

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await loginAction(
      null,
      toFormData({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.RATE_LIMITED })
    expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('returns validation error for invalid email', async () => {
    const result = await loginAction(
      null,
      toFormData({
        email: 'not-an-email',
        password: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns validation error for empty password', async () => {
    const result = await loginAction(
      null,
      toFormData({
        email: VALID_EMAIL,
        password: '',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns invalid credentials error when Supabase rejects login', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await loginAction(
      null,
      toFormData({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.INVALID_CREDENTIALS })
  })

  it('redirects to /chat on successful login', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '1' }, session: {} },
      error: null,
    })

    await loginAction(
      null,
      toFormData({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(redirect).toHaveBeenCalledWith('/chat')
  })

  it('redirects to custom path when valid redirect is provided', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '1' }, session: {} },
      error: null,
    })

    const fd = toFormData({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      redirect: '/account',
    })

    await loginAction(null, fd)

    expect(redirect).toHaveBeenCalledWith('/account')
  })

  it('ignores redirect with double slash prefix (open redirect prevention)', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '1' }, session: {} },
      error: null,
    })

    const fd = toFormData({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      redirect: '//evil.com',
    })

    await loginAction(null, fd)

    expect(redirect).toHaveBeenCalledWith('/chat')
  })

  it('ignores redirect containing protocol (open redirect prevention)', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '1' }, session: {} },
      error: null,
    })

    const fd = toFormData({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      redirect: 'http://evil.com/path',
    })

    await loginAction(null, fd)

    expect(redirect).toHaveBeenCalledWith('/chat')
  })

  it('passes email and password to Supabase signInWithPassword', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '1' }, session: {} },
      error: null,
    })

    await loginAction(
      null,
      toFormData({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })
  })
})

describe('signupAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await signupAction(
      null,
      toFormData({
        displayName: 'Alice',
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.RATE_LIMITED })
    expect(mockSupabaseAuth.signUp).not.toHaveBeenCalled()
  })

  it('returns validation error for invalid email', async () => {
    const result = await signupAction(
      null,
      toFormData({
        displayName: 'Alice',
        email: 'bad',
        password: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns validation error for weak password', async () => {
    const result = await signupAction(
      null,
      toFormData({
        displayName: 'Alice',
        email: VALID_EMAIL,
        password: 'short',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns validation error for empty display name', async () => {
    const result = await signupAction(
      null,
      toFormData({
        displayName: '',
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns signup failed error when Supabase rejects signup', async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already exists' },
    })

    const result = await signupAction(
      null,
      toFormData({
        displayName: 'Alice',
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.SIGNUP_FAILED })
  })

  it('redirects to /chat on successful signup', async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: { id: '1' } },
      error: null,
    })

    await signupAction(
      null,
      toFormData({
        displayName: 'Alice',
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(redirect).toHaveBeenCalledWith('/chat')
  })

  it('passes emailRedirectTo and display_name in signup options', async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { user: { id: '1' } },
      error: null,
    })

    await signupAction(
      null,
      toFormData({
        displayName: 'Alice',
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      })
    )

    expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      options: {
        emailRedirectTo: `${APP_URL}/api/auth/callback`,
        data: { display_name: 'Alice' },
      },
    })
  })
})

describe('forgotPasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await forgotPasswordAction(
      null,
      toFormData({
        email: VALID_EMAIL,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.RATE_LIMITED })
  })

  it('returns validation error for invalid email', async () => {
    const result = await forgotPasswordAction(
      null,
      toFormData({
        email: 'not-email',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('always returns success even if email does not exist (prevents enumeration)', async () => {
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null })

    const result = await forgotPasswordAction(
      null,
      toFormData({
        email: VALID_EMAIL,
      })
    )

    expect(result).toEqual({ success: AUTH_SUCCESS.SENT })
  })

  it('calls resetPasswordForEmail with correct redirectTo URL', async () => {
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null })

    await forgotPasswordAction(
      null,
      toFormData({
        email: VALID_EMAIL,
      })
    )

    expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
      VALID_EMAIL,
      { redirectTo: `${APP_URL}/api/auth/callback?type=recovery` }
    )
  })
})

describe('resetPasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkAuthRateLimit).mockResolvedValue(true)
  })

  it('returns rate limited error when rate limit is exceeded', async () => {
    vi.mocked(checkAuthRateLimit).mockResolvedValue(false)

    const result = await resetPasswordAction(
      null,
      toFormData({
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.RATE_LIMITED })
  })

  it('returns validation error for weak password', async () => {
    const result = await resetPasswordAction(
      null,
      toFormData({
        password: 'short',
        confirmPassword: 'short',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.VALIDATION })
  })

  it('returns passwords dont match error when passwords differ', async () => {
    const result = await resetPasswordAction(
      null,
      toFormData({
        password: VALID_PASSWORD,
        confirmPassword: 'Different1',
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.PASSWORDS_DONT_MATCH })
  })

  it('returns unauthorized error when no user session exists', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const result = await resetPasswordAction(
      null,
      toFormData({
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.UNAUTHORIZED })
  })

  it('returns reset failed error when updateUser fails', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: '1', email: VALID_EMAIL } },
    })
    mockSupabaseAuth.updateUser.mockResolvedValue({
      error: { message: 'Password update failed' },
    })

    const result = await resetPasswordAction(
      null,
      toFormData({
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      })
    )

    expect(result).toEqual({ error: AUTH_ERROR.RESET_FAILED })
  })

  it('signs out and redirects on successful password reset', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: '1', email: VALID_EMAIL } },
    })
    mockSupabaseAuth.updateUser.mockResolvedValue({ error: null })
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

    await resetPasswordAction(
      null,
      toFormData({
        password: VALID_PASSWORD,
        confirmPassword: VALID_PASSWORD,
      })
    )

    expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
      password: VALID_PASSWORD,
    })
    expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith('/auth/login?reset=success')
  })
})

describe('logoutAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('signs out and redirects to homepage', async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

    await logoutAction()

    expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(redirect).toHaveBeenCalledWith('/')
  })
})
