export const AUTH_ERROR = {
  VALIDATION: 'validation',
  INVALID_CREDENTIALS: 'invalid_credentials',
  SIGNUP_FAILED: 'signup_failed',
  UNAUTHORIZED: 'unauthorized',
  WRONG_PASSWORD: 'wrong_password',
  UPDATE_FAILED: 'update_failed',
  RESET_FAILED: 'reset_failed',
  DELETE_FAILED: 'delete_failed',
  EMAIL_UPDATE_FAILED: 'email_update_failed',
  RATE_LIMITED: 'rate_limited',
  PASSWORDS_DONT_MATCH: 'passwords_dont_match',
  SAME_PASSWORD: 'same_password',
  CREATE_FAILED: 'create_failed',
  SAVE_FAILED: 'save_failed',
  MIGRATION_FAILED: 'migration_failed',
} as const

export type AuthErrorCode = (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR]

export const AUTH_SUCCESS = {
  SENT: 'sent',
  PASSWORD_CHANGED: 'password_changed',
  EMAIL_CONFIRMATION_SENT: 'email_confirmation_sent',
} as const

export type AuthSuccessCode = (typeof AUTH_SUCCESS)[keyof typeof AUTH_SUCCESS]

export type AuthActionState = {
  error?: AuthErrorCode
  success?: AuthSuccessCode
} | null
