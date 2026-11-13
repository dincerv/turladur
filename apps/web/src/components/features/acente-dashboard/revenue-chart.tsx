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
    <div className="flex h-full min-h-[18rem] flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-neutral-900">
          Gelir grafiği
        </h3>
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
          {(Object.keys(RANGE_LABELS) as RevenueTimeRange[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTimeRange(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                timeRange === key
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {RANGE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-neutral-500">Gelir verisi henüz yok.</p>
      ) : (
        <div className="relative flex h-56 w-full items-end gap-2 overflow-visible pt-8">
          {points.map((point) => {
            const heightPct = (point.revenue / max) * 100;
            const label = `${point.revenue.toLocaleString('tr-TR')}₺`;
            return (
              <div
                key={point.label}
                className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
              >
                <div
                  className="pointer-events-none absolute bottom-[calc(100%-0.5rem)] z-10 mb-1 hidden -translate-y-1 rounded-md bg-neutral-950 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow-lg group-hover:block"
                  role="tooltip"
                >
                  {label}
                </div>
                <div
                  className="w-full max-w-[3rem] rounded-t-md bg-neutral-900/85 transition-all group-hover:bg-neutral-950"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                  aria-label={`${point.label}: ${label}`}
                />
                <span className="w-full truncate text-center text-[10px] text-neutral-500">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RevenueChart;
