import { NextRequest } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { assembleSystemPrompt } from '@/lib/ai/prompt-assembler'
import { sanitizeMessageContent } from '@/lib/ai/sanitize'
import { validateChatRequest } from '@/lib/ai/validate-chat-request'
import { log } from '@/lib/logger'
import { LOG_EVENT } from '@/lib/constants/logging'
import {
  checkAnonymousRateLimit,
  recordAnonymousConversation,
  consumeAuthenticatedConversation,
  consumeIpRequest,
} from '@/lib/ai/rate-limiter'
import { getOptionalAuth } from '@/lib/auth/helpers'
import { getClientIp, hashIp } from '@/lib/utils'
import {
  ANTHROPIC_MODEL,
  ANTHROPIC_MAX_TOKENS,
  NEW_CONVERSATION_MESSAGE_COUNT,
} from '@/lib/constants/chat'

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
  const ipHash = hashIp(clientIp)
  if (!(await consumeIpRequest(clientIp))) {
    log('warn', LOG_EVENT.RATE_LIMIT_HIT, { ipHash, type: 'ip' })
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

  // Validate request body (persona, messages, structure, detection)
  const result = validateChatRequest(body)
  if (!result.ok) {
    return Response.json(
      { error: result.error.error },
      { status: result.error.status }
    )
  }

  const { persona, messages, detection } = result.data

  try {
    // Rate limit: only count new conversations (detected by message count heuristic).
    const isNewConversation = messages.length === NEW_CONVERSATION_MESSAGE_COUNT
    if (isNewConversation) {
      if (auth.isAuthenticated) {
        // Atomic check-and-consume via PostgreSQL function
        const { allowed } = await consumeAuthenticatedConversation(auth.user.id)
        if (!allowed) {
          log('warn', LOG_EVENT.RATE_LIMIT_HIT, { ipHash, type: 'quota_auth' })
          return Response.json(
            { error: 'rate_limit_exceeded' },
            { status: 429 }
          )
        }
      } else {
        const rateResult = await checkAnonymousRateLimit()
        if (!rateResult.allowed) {
          log('warn', LOG_EVENT.RATE_LIMIT_HIT, { ipHash, type: 'quota_anon' })
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

    // Log every chat request with detection flags
    log('info', LOG_EVENT.CHAT_REQUEST, {
      persona,
      messageCount: messages.length,
      ipHash,
      isNewConversation,
      suspicious: detection.suspicious,
    })
    if (detection.suspicious) {
      log('warn', LOG_EVENT.SUSPICIOUS_INPUT, {
        persona,
        ipHash,
        patterns: detection.patterns,
      })
    }

    const systemPrompt = await assembleSystemPrompt(persona)

    const anthropicMessages = messages.map((msg) => ({
      role: msg.role,
      content: sanitizeMessageContent(msg.content),
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
          log('error', LOG_EVENT.STREAM_ERROR, { persona, ipHash })
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
