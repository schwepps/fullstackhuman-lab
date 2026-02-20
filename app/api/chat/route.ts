import { NextRequest } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { assembleSystemPrompt } from '@/lib/ai/prompt-assembler'
import {
  checkAnonymousRateLimit,
  recordAnonymousConversation,
  consumeAuthenticatedConversation,
  consumeIpRequest,
} from '@/lib/ai/rate-limiter'
import { getOptionalAuth } from '@/lib/auth/helpers'
import { getClientIp } from '@/lib/utils'
import { PERSONA_IDS } from '@/lib/constants/personas'
import {
  ANTHROPIC_MODEL,
  ANTHROPIC_MAX_TOKENS,
  MAX_MESSAGES_PER_REQUEST,
  CHAT_INPUT_MAX_LENGTH,
  MAX_MESSAGE_LENGTH,
  NEW_CONVERSATION_MESSAGE_COUNT,
  VALID_MESSAGE_ROLES,
} from '@/lib/constants/chat'
import type { PersonaId } from '@/types/chat'

function isValidPersona(value: unknown): value is PersonaId {
  return typeof value === 'string' && PERSONA_IDS.includes(value as PersonaId)
}

function isValidMessageRole(
  role: unknown
): role is (typeof VALID_MESSAGE_ROLES)[number] {
  return (
    typeof role === 'string' &&
    VALID_MESSAGE_ROLES.includes(role as (typeof VALID_MESSAGE_ROLES)[number])
  )
}

export async function POST(request: NextRequest) {
  // CSRF: require Origin header and verify it matches host.
  // fetch() POST always sends Origin in modern browsers.
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const originHost = new URL(origin).host
    if (originHost !== host) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Server-side IP rate limiting (defense in depth)
  const clientIp = getClientIp(request.headers)
  if (!consumeIpRequest(clientIp)) {
    return Response.json({ error: 'rate_limit_exceeded' }, { status: 429 })
  }

  // Check auth state (non-blocking — anonymous users get null)
  const auth = await getOptionalAuth()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { persona, messages } = body as Record<string, unknown>

  if (!isValidPersona(persona)) {
    return Response.json({ error: 'Invalid persona' }, { status: 400 })
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Messages are required' }, { status: 400 })
  }

  if (messages.length > MAX_MESSAGES_PER_REQUEST) {
    return Response.json({ error: 'Too many messages' }, { status: 400 })
  }

  // Validate each message: role must be user|assistant, content must be string
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return Response.json({ error: 'Invalid message format' }, { status: 400 })
    }
    const { role, content } = msg as Record<string, unknown>
    if (!isValidMessageRole(role)) {
      return Response.json({ error: 'Invalid message role' }, { status: 400 })
    }
    if (typeof content !== 'string') {
      return Response.json(
        { error: 'Invalid message content' },
        { status: 400 }
      )
    }
    // Enforce role-appropriate length limits
    const maxLength =
      role === 'user' ? CHAT_INPUT_MAX_LENGTH : MAX_MESSAGE_LENGTH
    if (content.length > maxLength) {
      return Response.json({ error: 'Message too long' }, { status: 400 })
    }
  }

  try {
    // Rate limit: only count new conversations (detected by message count heuristic).
    const isNewConversation = messages.length === NEW_CONVERSATION_MESSAGE_COUNT
    if (isNewConversation) {
      if (auth.isAuthenticated) {
        // Atomic check-and-consume via PostgreSQL function
        const { allowed } = await consumeAuthenticatedConversation(auth.user.id)
        if (!allowed) {
          return Response.json(
            { error: 'rate_limit_exceeded' },
            { status: 429 }
          )
        }
      } else {
        const rateResult = await checkAnonymousRateLimit()
        if (!rateResult.allowed) {
          return Response.json(
            { error: 'rate_limit_exceeded' },
            { status: 429 }
          )
        }
        // Record immediately after check passes, before stream creation.
        // Prevents bypass via stream failures that would skip recording.
        await recordAnonymousConversation()
      }
    }

    const systemPrompt = await assembleSystemPrompt(persona)

    const anthropicMessages = (
      messages as { role: string; content: string }[]
    ).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    const client = getAnthropicClient()
    const stream = client.messages.stream({
      model: ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                )
              )
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return Response.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
