import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  changeEmailSchema,
  deleteAccountSchema,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_PATTERN_HTML,
} from '@/lib/auth/schemas'

// --- Helpers ---

function getIssues(result: { success: false; error: { issues: unknown[] } }) {
  return result.error.issues as Array<{
    code: string
    path: string[]
    message: string
  }>
}

function expectFail(result: { success: boolean }) {
  expect(result.success).toBe(false)
}

function expectPass(result: { success: boolean }) {
  expect(result.success).toBe(true)
}

// Valid password that satisfies all constraints: letters + digits, >= 8 chars
const VALID_PASSWORD = 'Passw0rd'

// --- Exported constants ---

describe('auth schema constants', () => {
  it('PASSWORD_MIN_LENGTH equals 8', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8)
  })

  it('PASSWORD_MAX_LENGTH equals 128', () => {
    expect(PASSWORD_MAX_LENGTH).toBe(128)
  })

  it('DISPLAY_NAME_MAX_LENGTH equals 100', () => {
    expect(DISPLAY_NAME_MAX_LENGTH).toBe(100)
  })

  it('PASSWORD_PATTERN_HTML equals the expected HTML pattern', () => {
    expect(PASSWORD_PATTERN_HTML).toBe('(?=.*[a-zA-Z])(?=.*\\d).+')
  })
})

// --- loginSchema ---

describe('loginSchema', () => {
  it('passes with valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'mypassword',
    })
    expectPass(result)
  })

  it('fails when email is missing', () => {
    const result = loginSchema.safeParse({ password: 'mypassword' })
    expectFail(result)
  })

  it('fails when password is missing', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com' })
    expectFail(result)
  })

  it('fails when email is invalid', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'mypassword',
    })
    expectFail(result)
  })

  it('fails when password is whitespace-only (trimmed to empty)', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '   ',
    })
    expectFail(result)
  })

  it('fails when email has surrounding whitespace', () => {
    // Zod v4 z.email().trim() validates format before trimming,
    // so whitespace-padded emails are correctly rejected
    const result = loginSchema.safeParse({
      email: '  user@example.com  ',
      password: 'mypassword',
    })
    expectFail(result)
  })

  it('trims password whitespace before min-length check', () => {
    // A password of "   a   " should trim to "a" which is min(1), so it passes
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '   a   ',
    })
    expectPass(result)
    if (result.success) {
      expect(result.data.password).toBe('a')
    }
  })
})

// --- signupSchema ---

describe('signupSchema', () => {
  const validSignup = {
    displayName: 'Alice',
    email: 'alice@example.com',
    password: VALID_PASSWORD,
  }

  it('passes with valid data', () => {
    const result = signupSchema.safeParse(validSignup)
    expectPass(result)
  })

  it('passes with unicode display name', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      displayName: "Francois-Rene D'Arc",
    })
    expectPass(result)
  })

  it('passes with accented characters in display name', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      displayName: 'Rene',
    })
    expectPass(result)
  })

  it('fails with invalid characters in display name', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      displayName: 'Alice<script>',
    })
    expectFail(result)
  })

  it('fails when display name exceeds DISPLAY_NAME_MAX_LENGTH', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      displayName: 'A'.repeat(DISPLAY_NAME_MAX_LENGTH + 1),
    })
    expectFail(result)
  })

  it('passes when display name is exactly DISPLAY_NAME_MAX_LENGTH', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      displayName: 'A'.repeat(DISPLAY_NAME_MAX_LENGTH),
    })
    expectPass(result)
  })

  it('fails when display name is whitespace-only', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      displayName: '   ',
    })
    expectFail(result)
  })

  it('fails when password is too short', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'Ab1',
    })
    expectFail(result)
    if (!result.success) {
      const issues = getIssues(result)
      expect(issues.some((i) => i.message.includes('at least'))).toBe(true)
    }
  })

  it('fails when password has no digits', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'Abcdefgh',
    })
    expectFail(result)
  })

  it('fails when password has no letters', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: '12345678',
    })
    expectFail(result)
  })

  it('fails when password has only special characters', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: '!@#$%^&*',
    })
    expectFail(result)
  })

  it('passes with letters + digits + special characters', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'Pass1!@#',
    })
    expectPass(result)
  })

  it('fails when password exceeds PASSWORD_MAX_LENGTH', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'a1' + 'x'.repeat(PASSWORD_MAX_LENGTH),
    })
    expectFail(result)
  })

  it('passes when password is exactly PASSWORD_MIN_LENGTH', () => {
    // 8 chars: letters + digit
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'Abcdef1x',
    })
    expectPass(result)
  })
})

// --- forgotPasswordSchema ---

describe('forgotPasswordSchema', () => {
  it('passes with valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    })
    expectPass(result)
  })

  it('fails with invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-email' })
    expectFail(result)
  })

  it('fails with empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' })
    expectFail(result)
  })
})

// --- resetPasswordSchema ---

describe('resetPasswordSchema', () => {
  it('passes with valid matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    })
    expectPass(result)
  })

  it('fails when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({
      password: VALID_PASSWORD,
      confirmPassword: 'Different1',
    })
    expectFail(result)
    if (!result.success) {
      const issues = getIssues(result)
      const mismatchIssue = issues.find((i) =>
        i.path.includes('confirmPassword')
      )
      expect(mismatchIssue).toBeDefined()
      expect(mismatchIssue?.code).toBe('custom')
    }
  })

  it('fails when password is too short', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Ab1',
      confirmPassword: 'Ab1',
    })
    expectFail(result)
  })

  it('fails when password lacks required character types', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    })
    expectFail(result)
  })

  it('fails when confirmPassword is empty', () => {
    const result = resetPasswordSchema.safeParse({
      password: VALID_PASSWORD,
      confirmPassword: '',
    })
    expectFail(result)
  })
})

// --- changePasswordSchema ---

describe('changePasswordSchema', () => {
  const validChange = {
    currentPassword: 'OldPass1',
    newPassword: 'NewPass2',
    confirmPassword: 'NewPass2',
  }

  it('passes with valid data', () => {
    const result = changePasswordSchema.safeParse(validChange)
    expectPass(result)
  })

  it('fails when current and new password are the same', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: VALID_PASSWORD,
      newPassword: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    })
    expectFail(result)
    if (!result.success) {
      const issues = getIssues(result)
      const samePasswordIssue = issues.find((i) =>
        i.path.includes('newPassword')
      )
      expect(samePasswordIssue).toBeDefined()
      expect(samePasswordIssue?.code).toBe('custom')
      expect(samePasswordIssue?.message).toContain('different')
    }
  })

  it('fails when new and confirm passwords do not match', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass2',
      confirmPassword: 'Mismatch3',
    })
    expectFail(result)
    if (!result.success) {
      const issues = getIssues(result)
      const mismatchIssue = issues.find((i) =>
        i.path.includes('confirmPassword')
      )
      expect(mismatchIssue).toBeDefined()
      expect(mismatchIssue?.code).toBe('custom')
    }
  })

  it('fails when new password lacks required character types', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'noletter',
      confirmPassword: 'noletter',
    })
    expectFail(result)
  })

  it('fails when new password is too short', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'Nw1',
      confirmPassword: 'Nw1',
    })
    expectFail(result)
  })

  it('fails when currentPassword is empty', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'NewPass2',
      confirmPassword: 'NewPass2',
    })
    expectFail(result)
  })

  it('fails when currentPassword is whitespace-only', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '   ',
      newPassword: 'NewPass2',
      confirmPassword: 'NewPass2',
    })
    expectFail(result)
  })
})

// --- changeEmailSchema ---

describe('changeEmailSchema', () => {
  it('passes with valid email and password', () => {
    const result = changeEmailSchema.safeParse({
      email: 'new@example.com',
      password: 'mypassword',
    })
    expectPass(result)
  })

  it('fails with invalid email', () => {
    const result = changeEmailSchema.safeParse({
      email: 'bad-email',
      password: 'mypassword',
    })
    expectFail(result)
  })

  it('fails when password is empty', () => {
    const result = changeEmailSchema.safeParse({
      email: 'new@example.com',
      password: '',
    })
    expectFail(result)
  })

  it('fails when password is whitespace-only', () => {
    const result = changeEmailSchema.safeParse({
      email: 'new@example.com',
      password: '   ',
    })
    expectFail(result)
  })
})

// --- deleteAccountSchema ---

describe('deleteAccountSchema', () => {
  it('passes with valid password', () => {
    const result = deleteAccountSchema.safeParse({ password: 'mypassword' })
    expectPass(result)
  })

  it('fails when password is empty', () => {
    const result = deleteAccountSchema.safeParse({ password: '' })
    expectFail(result)
  })

  it('fails when password is whitespace-only', () => {
    const result = deleteAccountSchema.safeParse({ password: '   ' })
    expectFail(result)
  })

  it('fails when password is missing', () => {
    const result = deleteAccountSchema.safeParse({})
    expectFail(result)
  })
})
