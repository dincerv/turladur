/** Mirrors `ActivityListingCard` box model so swapping in real cards causes no layout shift. */
export function ActivityCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col overflow-hidden rounded-xl border border-neutral-100/80 bg-white shadow-sm"
    >
      <div className="aspect-[4/3] w-full animate-pulse bg-neutral-200" />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 min-h-[2.75rem] space-y-2">
          <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="mb-1 h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
        <div className="mb-3 h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
        <div className="mt-auto flex items-center justify-between border-t border-neutral-100/80 pt-3">
          <div className="h-6 w-20 animate-pulse rounded bg-neutral-200" />
          <div className="h-8 w-24 animate-pulse rounded-md bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
