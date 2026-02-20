'use client'

import { Separator } from '@/components/ui/separator'

interface OAuthDividerProps {
  children: React.ReactNode
}

export function OAuthDivider({ children }: OAuthDividerProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <Separator />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {children}
        </span>
      </div>
    </div>
  )
}
