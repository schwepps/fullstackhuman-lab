'use client'

import { useEffect } from 'react'
import { PERSONA_IDS, SEO_PERSONAS } from '@/lib/constants/personas'

/**
 * Registers WebMCP tools for AI agent discoverability.
 * Uses navigator.modelContext (Chrome 146+ early preview).
 *
 * Renders nothing — just registers tools on mount.
 *
 * @experimental WebMCP API is unstable. Feature detection ensures graceful
 * degradation in browsers without support.
 */
export function WebMcpRegistration() {
  useEffect(() => {
    if (!navigator.modelContext) return

    navigator.modelContext.registerTool({
      name: 'get_personas',
      description:
        'Get the available consulting personas and their descriptions. Fullstackhuman offers three AI consulting modes: The Doctor (project diagnostics), The Critic (honest reviews), and The Guide (strategic reframing).',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: () => ({
        personas: SEO_PERSONAS.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })),
      }),
    })

    navigator.modelContext.registerTool({
      name: 'start_consultation',
      description:
        'Navigate to a consultation with a specific persona. Opens the chat page with the selected persona pre-loaded.',
      inputSchema: {
        type: 'object',
        properties: {
          persona: {
            type: 'string',
            description: 'The persona to start a consultation with',
            enum: [...PERSONA_IDS],
          },
        },
        required: ['persona'],
      },
      handler: ({ persona }) => {
        const id = String(persona)
        if (!PERSONA_IDS.includes(id as (typeof PERSONA_IDS)[number])) {
          return { error: 'Invalid persona' }
        }
        window.location.href = `/chat?persona=${id}`
        return { status: 'navigating', persona: id }
      },
    })
  }, [])

  return null
}
