'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { MarkdownRenderer } from '@/components/chat/markdown-renderer'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
import type { PersonaId } from '@/types/chat'

interface ReportCardProps {
  content: string
  persona: PersonaId
}

export function ReportCard({ content, persona }: ReportCardProps) {
  const t = useTranslations('chat.report')
  const [copied, setCopied] = useState(false)
  const Illustration = PERSONA_ILLUSTRATIONS[persona]

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (HTTP, iframe, or permission denied)
    }
  }, [content])

  return (
    <Card className="terminal-border my-2 border-primary/30 bg-card/50">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2 text-sm text-primary">
          <Illustration className="size-5 text-primary" />
          <span className="font-mono uppercase tracking-wider">
            {t('label')}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <MarkdownRenderer content={content} />
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="touch-manipulation"
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              {t('copied')}
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              {t('copy')}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
