'use client'

import { useState, useCallback } from 'react'
import { countWords } from '@/lib/word-counter'
import { MAX_PROMPT_WORDS, BASE_PATH } from '@/lib/constants'
import type { Player } from '@/lib/types'

interface MessageFormProps {
  roomCode: string
  sessionId: string
  players: Player[]
  onComplete: () => void
}

export function MessageForm({
  roomCode,
  sessionId,
  players,
  onComplete,
}: MessageFormProps) {
  const [prompt, setPrompt] = useState('')
  const [targetSessionId, setTargetSessionId] = useState('')
  const [isDefense, setIsDefense] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>(
    'idle'
  )
  const [error, setError] = useState<string | null>(null)

  const wordCount = countWords(prompt)
  const isOverLimit = wordCount > MAX_PROMPT_WORDS
  const canSubmit =
    prompt.trim().length > 0 && !isOverLimit && status === 'idle'

  const targetPlayer = players.find((p) => p.sessionId === targetSessionId)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSubmit) return

      setIsSubmitting(true)
      setStatus('streaming')
      setGeneratedContent('')
      setError(null)

      try {
        const res = await fetch(`${BASE_PATH}/api/room/${roomCode}/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            prompt: prompt.trim(),
            targetName: targetPlayer?.name ?? null,
            isDefense,
          }),
        })

        if (!res.ok || !res.body) {
          const data = await res
            .json()
            .catch(() => ({ message: 'Request failed' }))
          setError(data.message ?? 'Failed to submit')
          setStatus('error')
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let content = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7)
              const nextLine = lines[i + 1]
              if (nextLine?.startsWith('data: ')) {
                try {
                  const data = JSON.parse(nextLine.slice(6))
                  if (eventType === 'token') {
                    content += data.text
                    setGeneratedContent(content)
                  } else if (eventType === 'complete') {
                    setStatus('done')
                  } else if (eventType === 'error') {
                    setError(data.message)
                    setStatus('error')
                  }
                } catch {
                  // Skip malformed
                }
                i++
              }
            }
          }
        }

        setStatus((prev) => (prev === 'error' ? 'error' : 'done'))
        setTimeout(onComplete, 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed')
        setStatus('error')
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      prompt,
      sessionId,
      roomCode,
      targetPlayer,
      isDefense,
      canSubmit,
      onComplete,
    ]
  )

  // Show generated content
  if (status === 'streaming' || status === 'done') {
    return (
      <div className="card p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
          {status === 'streaming'
            ? 'AI is fabricating evidence...'
            : 'Evidence submitted!'}
        </p>
        <div className="evidence-card border-l-primary bg-surface">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {generatedContent}
            {status === 'streaming' && (
              <span className="inline-block w-2 animate-[evidence-typewriter_0.5s_step-end_infinite] border-r-2 border-primary">
                &nbsp;
              </span>
            )}
          </pre>
        </div>
      </div>
    )
  }

  const otherPlayers = players.filter((p) => p.sessionId !== sessionId)

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
        Your Move
      </h3>

      {/* Defense toggle */}
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setIsDefense(false)}
          className={`flex-1 min-h-11 rounded-md px-3 py-2 text-xs font-semibold touch-manipulation transition-colors ${
            !isDefense
              ? 'bg-danger text-white'
              : 'bg-surface text-muted-foreground'
          }`}
        >
          Accuse
        </button>
        <button
          type="button"
          onClick={() => setIsDefense(true)}
          className={`flex-1 min-h-11 rounded-md px-3 py-2 text-xs font-semibold touch-manipulation transition-colors ${
            isDefense
              ? 'bg-accent text-background'
              : 'bg-surface text-muted-foreground'
          }`}
        >
          Defend
        </button>
      </div>

      {/* Target picker (for accusations) */}
      {!isDefense && otherPlayers.length > 0 && (
        <div className="mb-3">
          <label
            htmlFor="target-select"
            className="mb-1 block text-xs font-semibold text-muted-foreground"
          >
            Who are you accusing?
          </label>
          <select
            id="target-select"
            value={targetSessionId}
            onChange={(e) => setTargetSessionId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Anyone (general accusation)</option>
            {otherPlayers.map((p) => (
              <option key={p.sessionId} value={p.sessionId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Prompt input */}
      <div className="mb-3">
        <label
          htmlFor="message-prompt"
          className="mb-1 block text-xs font-semibold text-muted-foreground"
        >
          Your prompt (max {MAX_PROMPT_WORDS} words — defend and/or accuse)
        </label>
        <textarea
          id="message-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            isDefense
              ? 'e.g., As my calendar, show I was in back-to-back meetings...'
              : 'e.g., As the office security camera, describe what you saw...'
          }
          rows={2}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-describedby="msg-word-count"
          disabled={isSubmitting}
        />
        <p
          id="msg-word-count"
          className={`mt-1 text-xs ${isOverLimit ? 'text-danger' : 'text-muted-foreground'}`}
          aria-live="polite"
        >
          {wordCount}/{MAX_PROMPT_WORDS} words
        </p>
      </div>

      {error && (
        <p className="mb-3 text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="btn btn-primary w-full"
      >
        {isSubmitting ? 'Generating...' : 'Submit Evidence'}
      </button>
    </form>
  )
}
