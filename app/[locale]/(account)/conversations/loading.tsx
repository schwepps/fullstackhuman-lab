import { Skeleton } from '@/components/ui/skeleton'

export default function ConversationsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-sm" />
        <Skeleton className="h-8 w-20 rounded-sm" />
        <Skeleton className="h-8 w-20 rounded-sm" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
