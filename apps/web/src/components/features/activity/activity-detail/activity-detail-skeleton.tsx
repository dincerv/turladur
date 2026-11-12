const BAR = 'animate-pulse rounded-md bg-neutral-200/80';

/** Mirrors `ActivityDetailView` box sizes so streaming in causes no layout shift. */
export function ActivityDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="bg-neutral-50/60 pb-28 lg:pb-16"
    >
      <span className="sr-only">Aktivite yükleniyor…</span>
      <div
        aria-hidden
        className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8 lg:pt-28"
      >
        <div className={`${BAR} mb-4 h-5 w-64 max-w-full`} />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          <div>
            <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-neutral-200/80" />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-xl bg-neutral-200/80"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`${BAR} h-6 w-24`} />
              <div className="flex gap-2">
                <div className="h-11 w-11 animate-pulse rounded-full bg-neutral-200/80" />
                <div className="h-11 w-11 animate-pulse rounded-full bg-neutral-200/80" />
              </div>
            </div>
            <div className={`${BAR} h-9 w-full`} />
            <div className={`${BAR} h-9 w-2/3`} />
            <div className="space-y-2">
              <div className={`${BAR} h-4 w-full`} />
              <div className={`${BAR} h-4 w-full`} />
              <div className={`${BAR} h-4 w-4/5`} />
            </div>
            <div className="flex flex-wrap gap-2">
              {[28, 24, 32, 20].map((w) => (
                <div
                  key={w}
                  className="h-9 animate-pulse rounded-full bg-neutral-200/80"
                  style={{ width: `${w * 4}px` }}
                />
              ))}
            </div>
            <div className="h-[82px] animate-pulse rounded-2xl bg-neutral-200/80" />
          </div>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <div className="space-y-6">
            {[180, 260, 200].map((h) => (
              <div
                key={h}
                className="animate-pulse rounded-2xl bg-neutral-200/60"
                style={{ height: h }}
              />
            ))}
          </div>
          <div className="h-[420px] animate-pulse rounded-2xl bg-neutral-200/60" />
        </div>
      </div>
    </div>
  );
}
