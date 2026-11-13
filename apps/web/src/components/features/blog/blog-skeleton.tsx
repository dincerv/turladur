export function BlogCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white"
      aria-hidden
    >
      <div className="aspect-video animate-pulse bg-neutral-200" />
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-neutral-200" />
        <div className="h-5 w-3/5 animate-pulse rounded bg-neutral-100" />
        <div className="mt-1 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="mt-auto h-4 w-28 animate-pulse rounded bg-neutral-200 pt-3" />
      </div>
    </div>
  );
}

export function BlogSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      aria-busy
      aria-label="Yazılar yükleniyor"
    >
      {Array.from({ length: count }, (_, index) => (
        <BlogCardSkeleton key={index} />
      ))}
    </div>
  );
}
