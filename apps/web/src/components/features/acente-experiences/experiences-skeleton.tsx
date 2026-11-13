export function ExperiencesSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      data-testid="experiences-skeleton"
      aria-busy="true"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-neutral-200" />
          <div className="h-4 w-72 rounded bg-neutral-100" />
        </div>
        <div className="h-11 w-40 rounded-lg bg-neutral-200" />
      </div>
      <div className="h-12 rounded-xl bg-neutral-100" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-neutral-100 bg-white"
          >
            <div className="h-28 bg-neutral-200" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 rounded bg-neutral-100" />
              <div className="h-4 w-1/3 rounded bg-neutral-100" />
              <div className="flex justify-between">
                <div className="h-8 w-20 rounded bg-neutral-100" />
                <div className="h-8 w-24 rounded bg-neutral-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
