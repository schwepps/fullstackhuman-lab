import { Skeleton } from '@/components/ui/skeleton'

export default function ChatLoading() {
  return (
    <>
      {/* Header skeleton — mirrors ChatPageHeader (h-14, border-b) */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6">
        <Skeleton className="h-7 w-10" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      {/* Persona selector skeleton — mirrors PersonaSelector layout */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-10 text-center">
          <Skeleton className="mx-auto mb-3 h-8 w-64" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>

        <div className="grid w-full max-w-3xl gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 rounded-xl border border-border px-6 py-6"
            >
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
