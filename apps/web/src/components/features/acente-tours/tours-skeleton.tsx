function Block({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-neutral-200/80 ${className ?? ''}`}
    />
  );
}

export function ToursSkeleton({ listView = false }: { listView?: boolean }) {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Tur listesi yükleniyor"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Block className="h-8 w-40" />
          <Block className="h-4 w-72 max-w-full" />
        </div>
        <Block className="h-11 w-36" />
      </div>
      <Block className="h-16 w-full" />
      <div
        className={
          listView
            ? 'space-y-4'
            : 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'
        }
      >
        {Array.from({ length: listView ? 4 : 6 }).map((_, i) => (
          <Block
            key={i}
            className={listView ? 'h-36' : 'aspect-[4/3] min-h-[16rem]'}
          />
        ))}
      </div>
    </div>
  );
}
