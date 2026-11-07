'use client';

export function ToursLoadingSkeleton({
  itemsPerPage,
}: {
  itemsPerPage: number;
}) {
  const count = Math.min(Math.max(itemsPerPage, 1), 6);

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:gap-6"
      role="status"
      aria-label="Turlar yükleniyor"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
        >
          <div className="aspect-[4/3] animate-pulse bg-neutral-200" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
              <div className="h-6 w-20 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-14 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Yükleniyor…</span>
    </div>
  );
}
