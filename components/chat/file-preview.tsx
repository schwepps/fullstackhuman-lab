'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { FileText, X } from 'lucide-react'
import { formatFileSize, isImageType } from '@/lib/files/format'
import type { FileAttachment } from '@/types/chat'

interface FilePreviewProps {
  attachments: FileAttachment[]
  onRemove: (id: string) => void
}

export function FilePreview({ attachments, onRemove }: FilePreviewProps) {
  const t = useTranslations('chat.input')

  if (attachments.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="group relative flex min-w-0 shrink-0 items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2"
        >
          {isImageType(file.type) ? (
            /* eslint-disable-next-line @next/next/no-img-element -- inline base64 data URI, next/image unnecessary */
            <img
              src={`data:${file.type};base64,${file.data}`}
              alt={file.name}
              className="size-10 rounded object-cover"
            />
          ) : (
            <FileText className="size-5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <p className="max-w-32 truncate text-xs font-medium text-foreground">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(file.id)}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label={t('removeFile', { name: file.name })}
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  )
}
