export interface BootLine {
  readonly key: string
  readonly isHighlight: boolean
  readonly typingSpeedMs: number
}

const DEFAULT_SPEED = 30
const FAST_SPEED = 25

export const BOOT_LINES: readonly BootLine[] = [
  { key: 'mount', isHighlight: false, typingSpeedMs: DEFAULT_SPEED },
  { key: 'product', isHighlight: false, typingSpeedMs: DEFAULT_SPEED },
  { key: 'leadership', isHighlight: false, typingSpeedMs: DEFAULT_SPEED },
  { key: 'honesty', isHighlight: true, typingSpeedMs: FAST_SPEED },
  { key: 'deploy', isHighlight: true, typingSpeedMs: FAST_SPEED },
] as const

export const BOOT_INITIAL_DELAY_MS = 800
export const LINE_PAUSE_MS = 400
export const STATUS_FLASH_DELAY_MS = 200
