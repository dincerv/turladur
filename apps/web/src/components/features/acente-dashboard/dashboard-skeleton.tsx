function Block({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-neutral-200/80 ${className ?? ''}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Dashboard yükleniyor"
    >
      <div className="space-y-2">
        <Block className="h-8 w-64" />
        <Block className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Block className="h-28" />
        <Block className="h-28" />
        <Block className="h-28" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Block className="h-32" />
        <Block className="h-32" />
        <Block className="h-32" />
        <Block className="h-32" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Block className="h-64 min-w-0" />
        <Block className="h-64 min-w-0" />
      </div>

      <Block className="h-80" />
      <Block className="h-72" />
    </div>
  );
}

export function ChartSkeleton() {
  return <Block className="h-72 w-full" />;
}
