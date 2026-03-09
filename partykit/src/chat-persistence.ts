import type { ChatMessage, Player, ZoneType } from '../../lib/game/types'
import { MAX_CHAT_HISTORY_PER_ZONE } from '../../lib/game/constants'

/**
 * Append a chat message to a player's zone history, creating the zone entry
 * if it doesn't exist and trimming to MAX_CHAT_HISTORY_PER_ZONE.
 */
export function appendToChatHistory(
  player: Player,
  zone: ZoneType,
  message: ChatMessage
): void {
  let entry = player.chatHistory.find((e) => e.zone === zone)
  if (!entry) {
    entry = { zone, messages: [] }
    player.chatHistory.push(entry)
  }
  entry.messages.push(message)
  if (entry.messages.length > MAX_CHAT_HISTORY_PER_ZONE) {
    entry.messages = entry.messages.slice(-MAX_CHAT_HISTORY_PER_ZONE)
  }
}
