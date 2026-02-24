'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface DownloadPdfButtonProps {
  shareToken: string
}

export function DownloadPdfButton({ shareToken }: DownloadPdfButtonProps) {
  const t = useTranslations('reportTemplate')
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/report/${shareToken}/pdf`, {
        cache: 'no-store',
      })
      if (!res.ok) return
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const filename =
        disposition?.match(/filename="(.+)"/)?.[1] ?? 'report.pdf'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="touch-manipulation"
      disabled={isDownloading}
      onClick={handleDownload}
    >
      {isDownloading ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current/20 border-t-current" />
      ) : (
        <Download className="size-3.5" />
      )}
      {isDownloading ? t('downloadingPdf') : t('downloadPdf')}
    </Button>
  )
}
