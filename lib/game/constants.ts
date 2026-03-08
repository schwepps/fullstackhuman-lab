// ─── Room lifecycle ──────────────────────────────────────────────────────────
export const ROOM_TTL = 7200 // 2 hours in seconds

// ─── Canvas dimensions ──────────────────────────────────────────────────────
export const CANVAS_WIDTH = 1200
export const CANVAS_HEIGHT = 800
export const AVATAR_RADIUS = 20
export const MOVE_SPEED = 3

// ─── Avatar colors (server-assigned, 10 distinct cyberpunk colors) ──────────
export const AVATAR_COLORS = [
  0x22d3ee, // Electric Cyan
  0x4ade80, // Matrix Green
  0xf59e0b, // Amber
  0xa78bfa, // Violet
  0xfb923c, // Orange
  0xf472b6, // Pink
  0x38bdf8, // Sky Blue
  0xfbbf24, // Gold
  0x34d399, // Emerald
  0xe879f9, // Fuchsia
] as const

// ─── Broadcast intervals ────────────────────────────────────────────────────
export const POSITION_BROADCAST_INTERVAL_MS = 66 // ~15fps
export const ZONE_DEBOUNCE_MS = 500

// ─── Vote + elimination ─────────────────────────────────────────────────────
export const VOTE_TIMEOUT_MS = 60_000
export const ELIMINATION_PAUSE_MS = 2000

// ─── Rate limiting ──────────────────────────────────────────────────────────
export const MAX_CONCURRENT_ROOMS = 20
export const MAX_ROOMS_PER_IP_PER_HOUR = 3
export const MAX_MESSAGES_PER_MINUTE = 8
export const AGENT_RESPONSE_COOLDOWN_MS = 4000

// ─── Agent behavior ─────────────────────────────────────────────────────────
export const AGENT_STAGGER_BASE_MS = 2000
export const AGENT_STAGGER_MAX_MS = 8000
export const AGENT_RESPONSE_PROBABILITY = 0.6

// ─── Chat limits ────────────────────────────────────────────────────────────
export const MAX_MESSAGE_LENGTH = 300
export const MAX_CHAT_HISTORY_PER_ZONE = 50
export const AGENT_CONTEXT_MESSAGES = 15
export const MAX_AGENT_TOKENS = 120

// ─── Touch / mobile ─────────────────────────────────────────────────────────
export const DOUBLE_TAP_THRESHOLD_MS = 300
export const DOUBLE_TAP_DISTANCE_PX = 30
