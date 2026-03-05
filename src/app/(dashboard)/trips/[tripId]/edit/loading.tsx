import { Skeleton } from "@/components/ui/skeleton";

export default function TripEditorLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="border-b bg-card/80 sticky top-0 z-30 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <div className="h-4 w-px bg-border" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {[...Array(3)].map((_, d) => (
          <div key={d} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            {[...Array(3)].map((_, a) => (
              <div key={a} className="rounded-lg border bg-background p-3 flex gap-3">
                <Skeleton className="h-4 w-4 rounded mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
