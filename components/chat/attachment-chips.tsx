'use client'

import { FileText, ImageIcon } from 'lucide-react'
import { formatFileSize, isImageType } from '@/lib/files/format'
import type { FileAttachmentMeta } from '@/types/chat'

interface AttachmentChipsProps {
  attachments: FileAttachmentMeta[]
}

export function AttachmentChips({ attachments }: AttachmentChipsProps) {
  if (attachments.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {attachments.map((file) => (
        <span
          key={file.id}
          className="inline-flex items-center gap-1.5 rounded-md bg-background/50 px-2 py-1 text-xs text-muted-foreground"
        >
          {isImageType(file.type) ? (
            <ImageIcon className="size-3.5" />
          ) : (
            <FileText className="size-3.5" />
          )}
          <span className="max-w-24 truncate">{file.name}</span>
          <span className="text-muted-foreground/60">
            {formatFileSize(file.size)}
          </span>
        </span>
      ))}
    </div>
  )
}
