/** Structured log event names for the chat API. */
export const LOG_EVENT = {
  CHAT_REQUEST: 'chat_request',
  SUSPICIOUS_INPUT: 'suspicious_input',
  RATE_LIMIT_HIT: 'rate_limit_hit',
  STREAM_ERROR: 'stream_error',
  REDIS_FALLBACK: 'redis_fallback',
} as const
