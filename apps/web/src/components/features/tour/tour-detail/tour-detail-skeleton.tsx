/** CLS-safe loading shell for /tours/[id]. */
export function TourDetailSkeleton() {
  return (
    <div
      className="min-h-screen bg-gray-50"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative h-[380px] animate-pulse bg-neutral-200 md:h-[70vh]">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-3 lg:gap-12">
            <div className="space-y-6 lg:col-span-2">
              <div className="h-8 w-2/3 animate-pulse rounded-lg bg-neutral-200" />
              <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-6">
                <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-100" />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-xl bg-neutral-200"
                  />
                ))}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-7 w-36 animate-pulse rounded bg-neutral-200" />
                <div className="mb-6 h-10 w-28 animate-pulse rounded bg-neutral-200" />
                <div className="space-y-3">
                  <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />
                  <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />
                </div>
                <div className="mt-6 h-11 w-full animate-pulse rounded-lg bg-neutral-200" />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <p className="sr-only">Tur detayları yükleniyor</p>
    </div>
  );
}
