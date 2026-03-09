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

// ─── Game rules ──────────────────────────────────────────────────────────────
export const MIN_PLAYERS = 3
export const MAX_PLAYERS_PER_ROOM = 10
export const MIN_AGENTS_TO_ADD = 2
export const MAX_AGENTS_TO_ADD = 5
export const ROOM_ID_PATTERN = /^[a-z0-9]{1,20}$/
export const DEFAULT_AVATAR_COLOR = 0x22d3ee

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
export const AGENT_RESPONSE_PROBABILITY = 0.85

// ─── Agent autonomous behavior ──────────────────────────────────────────────
export const AGENT_TICK_MS = 100
// Agent speed per tick — scaled for 100ms tick rate (not 60fps frame rate).
// With 2-phase stagger (5 effective moves/s), 24 × 5 = 120 px/s base speed.
// Human keyboard speed is ~180 px/s, so agents are slightly slower but purposeful.
export const AGENT_SPEED_PX_PER_TICK = 24
export const AGENT_WAYPOINT_JITTER_PX = 20
export const AGENT_PATH_NOISE_PX = 2
export const AGENT_WAYPOINT_ARRIVAL_PX = 28
export const AGENT_CANVAS_MARGIN_PX = 30
export const AGENT_IDLE_BASE_MS = 500
export const AGENT_IDLE_JITTER_MS = 1500
export const AGENT_WANDER_IDLE_BASE_MS = 800
export const AGENT_WANDER_IDLE_JITTER_MS = 2000
export const AGENT_READING_MS_PER_CHAR = 30
export const AGENT_READING_MAX_MS = 3000
export const AGENT_FALSE_START_CHANCE = 0.15
export const AGENT_TOPIC_REACT_WINDOW_START_MS = 3000
export const AGENT_TOPIC_REACT_WINDOW_JITTER_MS = 8_000
export const AGENT_TOPIC_REACT_WINDOW_END_MS = 60_000
export const AGENT_ZONE_ENTRY_WINDOW_MS = 3000
export const AGENT_ZONE_ENTRY_DELAY_MS = 1000
export const AGENT_META_GAME_DELAY_MS = 30_000

// ─── Agent chat initiative ──────────────────────────────────────────────────
export const AGENT_INITIATIVE_COOLDOWN_MS = 8_000
export const AGENT_ZONE_ENTRY_GREET_CHANCE = 0.5
export const AGENT_TOPIC_REACT_CHANCE = 0.6
export const AGENT_IDLE_CHAT_CHANCE = 0.35
export const AGENT_META_GAME_CHANCE = 0.08
export const AGENT_TO_AGENT_PROBABILITY = 0.3
export const AGENT_TO_AGENT_STAGGER_BASE_MS = 4_000
export const AGENT_TO_AGENT_STAGGER_MAX_MS = 12_000
export const MAX_CONSECUTIVE_AGENT_MSGS = 3

// ─── Chat limits ────────────────────────────────────────────────────────────
export const MAX_MESSAGE_LENGTH = 300
export const MAX_CHAT_HISTORY_PER_ZONE = 50
export const AGENT_CONTEXT_MESSAGES = 15
export const MAX_AGENT_TOKENS = 120

// ─── Display ─────────────────────────────────────────────────────────────────
export const FALLBACK_NAME_LENGTH = 6
export const NAME_DISPLAY_MAX_LENGTH = 8
export const DEFAULT_SPAWN_POSITION = { x: 600, y: 400 } as const

// ─── Touch / mobile ─────────────────────────────────────────────────────────
export const DOUBLE_TAP_THRESHOLD_MS = 300
export const DOUBLE_TAP_DISTANCE_PX = 30

// ─── Partykit alarm keys ────────────────────────────────────────────────────
export const ALARM_ROUND_END = 'alarm:roundEnd'
export const ALARM_VOTE_END = 'alarm:voteEnd'
export const ALARM_START_ROUND = 'alarm:startRound'
