export function CampaignCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white"
      aria-hidden
    >
      <div className="aspect-[16/10] animate-pulse bg-neutral-200" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-5 w-4/5 animate-pulse rounded bg-neutral-200" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-neutral-100 pt-4">
          <div className="h-8 w-28 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

export function CampaignSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3"
      aria-busy
      aria-label="Kampanyalar yükleniyor"
    >
      {Array.from({ length: count }, (_, index) => (
        <CampaignCardSkeleton key={index} />
      ))}
    </div>
  );
}
