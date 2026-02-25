import { z } from 'zod/v4'

// IMPORTANT: Must match minimum_password_length in supabase/config.toml
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const DISPLAY_NAME_MAX_LENGTH = 100

// IMPORTANT: Must match password_requirements = "letters_digits" in supabase/config.toml
export const PASSWORD_LETTERS_DIGITS = /(?=.*[a-zA-Z])(?=.*\d)/
// HTML pattern attribute equivalent of PASSWORD_LETTERS_DIGITS (SSOT for form validation)
export const PASSWORD_PATTERN_HTML = '(?=.*[a-zA-Z])(?=.*\\d).+'
const PASSWORD_FORMAT_MESSAGE = 'Password must contain both letters and digits'

export const loginSchema = z.object({
  email: z.email({ error: 'Invalid email' }).trim(),
  password: z.string().trim().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(DISPLAY_NAME_MAX_LENGTH)
    .transform((s) => s.normalize('NFC'))
    .pipe(
      z
        .string()
        .regex(/^[\p{L}\p{N}\s\-'.]+$/u, 'Name contains invalid characters')
    ),
  email: z.email({ error: 'Invalid email' }).trim(),
  password: z
    .string()
    .trim()
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    )
    .max(PASSWORD_MAX_LENGTH)
    .regex(PASSWORD_LETTERS_DIGITS, PASSWORD_FORMAT_MESSAGE),
})

export const forgotPasswordSchema = z.object({
  email: z.email({ error: 'Invalid email' }).trim(),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .trim()
      .min(
        PASSWORD_MIN_LENGTH,
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
      )
      .max(PASSWORD_MAX_LENGTH)
      .regex(PASSWORD_LETTERS_DIGITS, PASSWORD_FORMAT_MESSAGE),
    confirmPassword: z.string().trim().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().trim().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .trim()
      .min(
        PASSWORD_MIN_LENGTH,
        `New password must be at least ${PASSWORD_MIN_LENGTH} characters`
      )
      .max(PASSWORD_MAX_LENGTH)
      .regex(PASSWORD_LETTERS_DIGITS, PASSWORD_FORMAT_MESSAGE),
    confirmPassword: z.string().trim().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const changeEmailSchema = z.object({
  email: z.email({ error: 'Invalid email' }).trim(),
  password: z.string().trim().min(1, 'Password is required'),
})

export const deleteAccountSchema = z.object({
  password: z.string().trim().min(1, 'Password is required'),
})
