import { Skeleton } from '@/components/ui/skeleton'

export default function AccountLoading() {
  return (
    <div className="space-y-8">
      {/* Page title */}
      <Skeleton className="h-8 w-48" />

      {/* Profile section */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-border" />

      {/* Change password form (3 inputs + button) */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full sm:h-10" />
            </div>
          ))}
          <Skeleton className="h-12 w-full sm:h-10" />
        </div>
      </section>

      <div className="h-px w-full bg-border" />

      {/* Change email form (2 inputs + button) */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full sm:h-10" />
            </div>
          ))}
          <Skeleton className="h-12 w-full sm:h-10" />
        </div>
      </section>

      <div className="h-px w-full bg-border" />

      {/* Delete account section */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-12 w-40 sm:h-10" />
      </section>
    </div>
  )
}
