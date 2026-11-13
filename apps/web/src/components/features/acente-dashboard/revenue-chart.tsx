'use client';

import { useMemo, useState } from 'react';

import type { DashboardRevenueChartData } from './types';

type RevenueTimeRange = keyof DashboardRevenueChartData;

type RevenueChartProps = {
  data: DashboardRevenueChartData;
};

const RANGE_LABELS: Record<RevenueTimeRange, string> = {
  week: 'Hafta',
  month: 'Ay',
  year: 'Yıl',
};

/** Lightweight CSS chart — loaded via next/dynamic (ssr: false). */
export function RevenueChart({ data }: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState<RevenueTimeRange>('month');
  const points = data[timeRange] ?? [];
  const max = useMemo(
    () => Math.max(1, ...points.map((p) => p.revenue)),
    [points],
  );

  return (
    <section
      aria-labelledby="revenue-chart-heading"
      className="flex h-full min-h-[18rem] min-w-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3
          id="revenue-chart-heading"
          className="text-base font-semibold text-neutral-900"
        >
          Gelir grafiği
        </h3>
        <div
          role="tablist"
          aria-label="Gelir zaman aralığı"
          className="flex shrink-0 gap-1 rounded-lg bg-neutral-100 p-1"
        >
          {(Object.keys(RANGE_LABELS) as RevenueTimeRange[]).map((key) => {
            const selected = timeRange === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTimeRange(key)}
                onKeyDown={(e) => {
                  const keys = Object.keys(RANGE_LABELS) as RevenueTimeRange[];
                  const idx = keys.indexOf(timeRange);
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setTimeRange(keys[(idx + 1) % keys.length]!);
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setTimeRange(keys[(idx - 1 + keys.length) % keys.length]!);
                  }
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-1 ${
                  selected
                    ? 'bg-white text-neutral-950 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {RANGE_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-neutral-500">Gelir verisi henüz yok.</p>
      ) : (
        <div
          className="flex h-56 min-w-0 w-full gap-1.5 sm:gap-2"
          role="img"
          aria-label={`Gelir grafiği — ${RANGE_LABELS[timeRange]}`}
        >
          {points.map((point) => {
            const heightPct = (point.revenue / max) * 100;
            const label = `${point.revenue.toLocaleString('tr-TR')}₺`;
            return (
              <div
                key={point.label}
                className="group flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div className="relative flex w-full min-h-0 flex-1 items-end justify-center pt-2">
                  <div
                    className="pointer-events-none absolute bottom-full z-10 mb-1 hidden -translate-y-0.5 rounded-md bg-neutral-950 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-lg group-hover:block group-focus-within:block"
                    role="tooltip"
                  >
                    {label}
                  </div>
                  <div
                    className="w-full max-w-[2.5rem] rounded-t-md bg-neutral-900/85 transition-all group-hover:bg-neutral-950"
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                    title={`${point.label}: ${label}`}
                    aria-label={`${point.label}: ${label}`}
                  />
                </div>
                <span className="w-full shrink-0 truncate text-center text-[10px] text-neutral-500">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RevenueChart;
