/**
 * Minimal structured logger — outputs JSON to stdout (captured by Vercel).
 *
 * Fire-and-forget: never throws, never blocks the request flow.
 * No external dependencies.
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  event: string
  timestamp: string
  [key: string]: unknown
}

/**
 * Emit a structured JSON log entry to stdout.
 * Safe to call anywhere — catches and silently drops internal errors.
 */
export function log(
  level: LogLevel,
  event: string,
  data?: Record<string, unknown>
): void {
  try {
    const entry: LogEntry = {
      level,
      event,
      timestamp: new Date().toISOString(),
      ...data,
    }
    console.log(JSON.stringify(entry))
  } catch {
    // Never throw from the logger — observability must not break the app
  }
}
