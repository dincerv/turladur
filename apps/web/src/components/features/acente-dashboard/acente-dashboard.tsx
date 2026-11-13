'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Building2, Calendar, Clock, Wallet } from 'lucide-react';

import { PopularTours } from '@/components/features/partner-dashboard/popular-tours';
import { RecentReservations } from '@/components/features/partner-dashboard/recent-reservations';
import { ReservationStatus } from '@/components/features/partner-dashboard/reservation-status';
import {
  canAccessStaffPermission,
  hasFullPartnerAccess,
} from '@/lib/partner-permissions';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import {
  getPartnerFinancials,
  getPartnerStats,
  listPartnerReservations,
  listPartnerTours,
  type PartnerReservation,
  type PartnerStats,
  type PartnerTour,
} from '@/services/partner-admin';

import { ChartSkeleton, DashboardSkeleton } from './dashboard-skeleton';
import {
  buildRevenueChart,
  countReservationStatuses,
  mapPopularTours,
  mapRecentReservations,
  monthOverMonthTrend,
  sanitizeDisplayText,
} from './helpers';
import { KpiCards } from './kpi-cards';
import { QuickActions } from './quick-actions';
import type { DashboardKpiCard, DashboardQuickAction } from './types';

const RevenueChart = dynamic(
  () =>
    import('./revenue-chart').then((mod) => ({ default: mod.RevenueChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export function AcenteDashboard() {
  const { accessToken, user } = useAuth();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [reservations, setReservations] = useState<PartnerReservation[]>([]);
  const [tours, setTours] = useState<PartnerTour[]>([]);
  const [months, setMonths] = useState<Array<{ month: string; total: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSeeRevenue = canAccessStaffPermission(
    user?.role,
    user?.permissions,
    'reports',
  );
  const canManageTours = canAccessStaffPermission(
    user?.role,
    user?.permissions,
    'tours',
  );
  const canManageReservations = canAccessStaffPermission(
    user?.role,
    user?.permissions,
    'reservations',
  );

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const [s, r, t, f] = await Promise.all([
          getPartnerStats(accessToken),
          canManageReservations
            ? listPartnerReservations(accessToken).catch(() => [])
            : Promise.resolve([] as PartnerReservation[]),
          canManageTours
            ? listPartnerTours(accessToken).catch(() => [])
            : Promise.resolve([] as PartnerTour[]),
          canSeeRevenue
            ? getPartnerFinancials(accessToken).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setStats(s);
        setReservations(r);
        setTours(t);
        setMonths(f?.months ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Dashboard yüklenemedi',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, canManageReservations, canManageTours, canSeeRevenue]);

  const reservationStatus = useMemo(
    () => countReservationStatuses(reservations),
    [reservations],
  );

  const revenueChart = useMemo(
    () =>
      buildRevenueChart(months, Number(stats?.revenue?.confirmedTotal) || 0),
    [months, stats],
  );

  const revenueTrend = useMemo(() => monthOverMonthTrend(months), [months]);

  const name = user
    ? sanitizeDisplayText(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        60,
      )
    : 'Acente';

  const quickAccessItems = useMemo(() => {
    const items: DashboardQuickAction[] = [];
    if (canManageTours) {
      items.push({
        title: 'Yeni Tur Ekle',
        description: 'Portföyünüze yeni bir tur ekleyin',
        icon: Building2,
        href: `${ACENTE_ROUTES.tours}/new`,
        color: 'blue',
      });
    }
    if (canSeeRevenue) {
      items.push({
        title: 'Raporları İncele',
        description: 'Performans ve gelir özetlerini görün',
        icon: BarChart3,
        href: ACENTE_ROUTES.reports,
        color: 'green',
      });
    }
    if (canManageReservations) {
      items.push({
        title: 'Rezervasyonları Yönet',
        description: 'Gelen rezervasyonları takip edin',
        icon: Calendar,
        href: ACENTE_ROUTES.reservations,
        color: 'amber',
      });
    }
    return items;
  }, [canManageReservations, canManageTours, canSeeRevenue]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="font-medium text-red-600">Dashboard yüklenemedi</p>
        <p className="max-w-md text-sm text-neutral-600">
          {sanitizeDisplayText(error, 200)}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const isOwner = hasFullPartnerAccess(user?.role);
  const showTourStats = isOwner || canManageTours;
  const showReservationStats = isOwner || canManageReservations;

  const kpiCards: DashboardKpiCard[] = [];
  if (showTourStats) {
    kpiCards.push({
      title: 'Toplam Tur',
      value: stats.tours.total.toString(),
      icon: Building2,
      hint: `${stats.tours.published} yayında`,
      trend:
        stats.tours.published > 0
          ? {
              direction: 'up',
              label: `${stats.tours.published} aktif yayın`,
            }
          : { direction: 'neutral', label: 'Henüz yayın yok' },
    });
  }
  if (showReservationStats) {
    kpiCards.push({
      title: 'Toplam Rezervasyon',
      value: stats.reservations.total.toString(),
      icon: Calendar,
      trend:
        stats.reservations.total > 0
          ? { direction: 'up', label: 'Kayıtlı rezervasyon' }
          : { direction: 'neutral', label: 'Henüz rezervasyon yok' },
    });
  }
  if (canSeeRevenue) {
    kpiCards.push({
      title: 'Toplam Gelir',
      value: `${Number(stats.revenue?.confirmedTotal ?? 0).toLocaleString('tr-TR')}₺`,
      icon: Wallet,
      trend: revenueTrend,
      hint: revenueTrend ? undefined : 'Onaylı rezervasyon cirosu',
    });
  }
  if (showTourStats) {
    kpiCards.push({
      title: 'İncelemede',
      value: stats.tours.pendingReview.toString(),
      icon: Clock,
      trend:
        stats.tours.pendingReview > 0
          ? { direction: 'down', label: 'Onay bekliyor' }
          : { direction: 'up', label: 'Bekleyen yok' },
    });
  }

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

      <QuickActions items={quickAccessItems} />
      <KpiCards cards={kpiCards.slice(0, 4)} />

      <div
        className={`grid grid-cols-1 gap-5 ${canSeeRevenue ? 'lg:grid-cols-3' : ''}`}
      >
        {showReservationStats ? (
          <ReservationStatus reservations={reservationStatus} />
        ) : null}
        {canSeeRevenue ? (
          <div className="min-h-[18rem] lg:col-span-2">
            <RevenueChart data={revenueChart} />
          </div>
        ) : null}
      </div>

      {showReservationStats ? (
        <RecentReservations
          reservations={mapRecentReservations(reservations, !canSeeRevenue)}
        />
      ) : null}
      {showTourStats ? <PopularTours tours={mapPopularTours(tours)} /> : null}
    </div>
  );
}
