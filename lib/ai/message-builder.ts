import type {
  ChatMessage,
  MessageRole,
  FileAttachment,
  FileAttachmentMeta,
} from '@/types/chat'
import type { AttachmentPayload } from '@/lib/ai/validate-chat-request'

/** API message shape sent from client to server */
export interface ApiMessage {
  role: MessageRole
  content: string
  attachments?: AttachmentPayload[]
}

export function createMessage(
  role: MessageRole,
  content: string,
  isReport = false,
  attachments?: FileAttachmentMeta[]
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    isReport,
    timestamp: Date.now(),
    ...(attachments?.length ? { attachments } : {}),
  }
}

export function buildApiMessages(
  messages: ChatMessage[],
  userMessage: ChatMessage,
  triggerText: string,
  attachments?: FileAttachment[]
): ApiMessage[] {
  const allMessages = [...messages, userMessage]
  return [
    { role: 'user' as const, content: triggerText },
    ...allMessages.map((msg, index) => {
      const isLastMessage = index === allMessages.length - 1
      const base: ApiMessage = {
        role: msg.role,
        content: msg.content,
      }
      // Only attach files to the current message being sent
      if (isLastMessage && attachments?.length) {
        base.attachments = attachments.map((a) => ({
          type: a.type,
          data: a.data,
          name: a.name,
          size: a.size,
        }))
      }
      return base
    }),
  ]
}
