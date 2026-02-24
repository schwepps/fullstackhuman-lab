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
  attachmentStore: ReadonlyMap<string, FileAttachment>
): ApiMessage[] {
  const allMessages = [...messages, userMessage]
  return [
    { role: 'user' as const, content: triggerText },
    ...allMessages.map((msg) => {
      const base: ApiMessage = {
        role: msg.role,
        content: msg.content,
      }
      // Re-hydrate attachment data from the store for any message with attachments
      if (msg.attachments?.length) {
        const hydrated = msg.attachments
          .map((meta) => attachmentStore.get(meta.id))
          .filter((a): a is FileAttachment => a !== undefined)
        if (hydrated.length > 0) {
          base.attachments = hydrated.map((a) => ({
            type: a.type,
            data: a.data,
            name: a.name,
            size: a.size,
          }))
        }
      }
      return base
    }),
  ]
}
