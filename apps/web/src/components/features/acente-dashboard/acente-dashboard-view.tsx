'use client';

import dynamic from 'next/dynamic';

import { PopularTours } from '@/components/features/partner-dashboard/popular-tours';
import { RecentReservations } from '@/components/features/partner-dashboard/recent-reservations';
import { ReservationStatus } from '@/components/features/partner-dashboard/reservation-status';

import { ChartSkeleton } from './dashboard-skeleton';
import { KpiCards } from './kpi-cards';
import { QuickActions } from './quick-actions';
import type {
  DashboardKpiCard,
  DashboardPopularTour,
  DashboardQuickAction,
  DashboardRecentReservation,
  DashboardRevenueChartData,
  DashboardStatusCounts,
} from './types';

const RevenueChart = dynamic(
  () =>
    import('./revenue-chart').then((mod) => ({ default: mod.RevenueChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export type AcenteDashboardViewProps = {
  name: string;
  quickActions: DashboardQuickAction[];
  kpiCards: DashboardKpiCard[];
  statusCounts?: DashboardStatusCounts | null;
  revenueChart?: DashboardRevenueChartData | null;
  recentReservations?: DashboardRecentReservation[] | null;
  popularTours?: DashboardPopularTour[] | null;
};

export function AcenteDashboardView({
  name,
  quickActions,
  kpiCards,
  statusCounts,
  revenueChart,
  recentReservations,
  popularTours,
}: AcenteDashboardViewProps) {
  const showRevenue = Boolean(revenueChart);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
          Hoş geldiniz, {name}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-neutral-600">
          Acente panelinizdeki güncel özet, rezervasyon ve gelir görünümü.
        </p>
      </header>

      <QuickActions items={quickActions} />
      <KpiCards cards={kpiCards.slice(0, 4)} />

      <div
        className={
          showRevenue
            ? 'grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'
            : 'grid grid-cols-1 gap-5'
        }
      >
        {statusCounts ? (
          <div className="min-w-0">
            <ReservationStatus reservations={statusCounts} />
          </div>
        ) : null}
        {revenueChart ? (
          <div className="min-h-[18rem] min-w-0">
            <RevenueChart data={revenueChart} />
          </div>
        ) : null}
      </div>

      {recentReservations ? (
        <RecentReservations reservations={recentReservations} />
      ) : null}
      {popularTours ? <PopularTours tours={popularTours} /> : null}
    </div>
  );
}
