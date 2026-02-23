'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { MarkdownRenderer } from '@/components/chat/markdown-renderer'
import { PERSONA_ILLUSTRATIONS } from '@/components/chat/illustrations'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import { ShareButton } from '@/components/report/share-button'
import { DownloadPdfButton } from '@/components/report/download-pdf-button'
import { buildReportShareUrl } from '@/lib/constants/reports'
import { stripVisualBlocks, PERSONA_EMOJI_REGEX } from '@/lib/visuals/parser'
import type { PersonaId } from '@/types/chat'

interface ReportCardProps {
  content: string
  persona: PersonaId
  shareToken: string | null
}

export function ReportCard({ content, persona, shareToken }: ReportCardProps) {
  const t = useTranslations('chat.report')
  const locale = useLocale()
  const [copied, setCopied] = useState(false)
  const { trackReportCopied } = useAnalytics()
  const Illustration = PERSONA_ILLUSTRATIONS[persona]

  const cleanContent = useMemo(
    () =>
      stripVisualBlocks(content).replace(
        new RegExp(`^(# )${PERSONA_EMOJI_REGEX.source}`, 'mu'),
        '$1'
      ),
    [content]
  )

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      trackReportCopied({ persona })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (HTTP, iframe, or permission denied)
    }
  }, [content, persona, trackReportCopied])

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
        <MarkdownRenderer content={cleanContent} />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
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
        {shareToken && (
          <ShareButton
            shareUrl={buildReportShareUrl(shareToken, locale)}
            persona={persona}
          />
        )}
        {shareToken && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="touch-manipulation"
          >
            <Link href={`/report/${shareToken}`}>
              <ExternalLink className="size-3.5" />
              {t('viewReport')}
            </Link>
          </Button>
        )}
        {shareToken && <DownloadPdfButton shareToken={shareToken} />}
      </CardFooter>
    </Card>
  )
}
