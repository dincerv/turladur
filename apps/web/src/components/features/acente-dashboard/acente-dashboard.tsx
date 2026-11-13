'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Building2, Calendar, Clock, Wallet } from 'lucide-react';

import {
  canAccessStaffPermission,
  hasFullPartnerAccess,
} from '@/lib/partner-permissions';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getPartnerFinancials,
  getPartnerStats,
  listPartnerReservations,
  listPartnerTours,
  type PartnerDashboardPopularTour,
  type PartnerDashboardRecentReservation,
  type PartnerDashboardStatusCounts,
  type PartnerStats,
} from '@/services/partner-admin';

import { AcenteDashboardView } from './acente-dashboard-view';
import { DashboardSkeleton } from './dashboard-skeleton';
import {
  buildRevenueChart,
  mapPopularTours,
  mapRecentReservations,
  monthOverMonthTrend,
  sanitizeDisplayText,
  toStatusCounts,
} from './helpers';
import type { DashboardKpiCard, DashboardQuickAction } from './types';

const SAFE_LOAD_ERROR = 'Dashboard yüklenemedi. Lütfen tekrar deneyin.';

function isOverviewComplete(stats: PartnerStats): boolean {
  return (
    stats.recentReservations !== undefined &&
    stats.popularTours !== undefined &&
    (stats.months !== undefined || stats.revenue === null)
  );
}

function countStatusesFromLegacy(
  rows: Array<{ status: string }>,
): PartnerDashboardStatusCounts {
  const counts: PartnerDashboardStatusCounts = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };
  for (const r of rows) {
    if (r.status === 'CONFIRMED') counts.confirmed += 1;
    else if (r.status === 'CANCELLED') counts.cancelled += 1;
    else if (r.status === 'COMPLETED') counts.completed += 1;
    else counts.pending += 1;
  }
  return counts;
}

export function AcenteDashboard() {
  const { accessToken, user } = useAuth();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

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

  const loadOverview = useCallback(
    async (token: string): Promise<PartnerStats> => {
      const overview = await getPartnerStats(token);
      if (isOverviewComplete(overview)) return overview;

      // Legacy Railway API: fill missing slices with limited side requests.
      const [reservations, tours, financials] = await Promise.all([
        canManageReservations || hasFullPartnerAccess(user?.role)
          ? listPartnerReservations(token).catch(() => [])
          : Promise.resolve([]),
        canManageTours || hasFullPartnerAccess(user?.role)
          ? listPartnerTours(token, { pageSize: 4 })
              .then((r) => r.items)
              .catch(() => [])
          : Promise.resolve([]),
        canSeeRevenue
          ? getPartnerFinancials(token).catch(() => null)
          : Promise.resolve(null),
      ]);

      const recentReservations: PartnerDashboardRecentReservation[] =
        overview.recentReservations ??
        reservations.slice(0, 5).map((r) => ({
          id: r.id,
          bookingNumber: r.bookingNumber,
          tourId: r.tourId,
          tourTitle: r.tourTitle,
          status: r.status,
          totalAmount: r.totalAmount,
          currency: r.currency,
          contactEmail: r.contactEmail,
          customerName: r.customerName || r.contactEmail,
          createdAt: r.createdAt,
        }));

      const popularTours: PartnerDashboardPopularTour[] =
        overview.popularTours ??
        tours.slice(0, 4).map((t) => ({
          id: t.id,
          title: t.title,
          category: t.category,
          price: t.price,
          currency: t.currency,
          coverUrl: t.coverUrl,
          reservationCount: 0,
          guestCount: 0,
          rating: 0,
          reviewCount: 0,
        }));

      const byStatus =
        overview.reservations?.byStatus ??
        countStatusesFromLegacy(reservations);

      return {
        tours: overview.tours,
        reservations: overview.reservations
          ? {
              total: overview.reservations.total,
              byStatus,
            }
          : null,
        revenue: overview.revenue,
        months: overview.months ?? financials?.months ?? null,
        recentReservations,
        popularTours,
      };
    },
    [canManageReservations, canManageTours, canSeeRevenue, user?.role],
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const overview = await loadOverview(accessToken);
      setStats(overview);
    } catch (err) {
      console.error('[acente-dashboard] load failed', {
        code: err instanceof ApiError ? err.code : 'UNKNOWN',
        status: err instanceof ApiError ? err.status : undefined,
      });
      setError(SAFE_LOAD_ERROR);
      setStats(null);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [accessToken, loadOverview]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const overview = await loadOverview(accessToken);
        if (!cancelled) setStats(overview);
      } catch (err) {
        if (!cancelled) {
          console.error('[acente-dashboard] load failed', {
            code: err instanceof ApiError ? err.code : 'UNKNOWN',
            status: err instanceof ApiError ? err.status : undefined,
          });
          setError(SAFE_LOAD_ERROR);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, loadOverview]);

  const revenueChart = useMemo(
    () =>
      buildRevenueChart(
        stats?.months,
        Number(stats?.revenue?.confirmedTotal) || 0,
      ),
    [stats],
  );

  const revenueTrend = useMemo(
    () => monthOverMonthTrend(stats?.months),
    [stats?.months],
  );

  const name = user
    ? sanitizeDisplayText(
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          user.email ||
          'Acente',
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
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center"
      >
        <p className="font-medium text-red-600">İşlem başarısız</p>
        <p className="max-w-md text-sm text-neutral-600">{error}</p>
        <button
          type="button"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            setLoading(true);
            void load();
          }}
          className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {retrying ? 'Yükleniyor…' : 'Tekrar dene'}
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const isOwner = hasFullPartnerAccess(user?.role);
  const showTourStats = (isOwner || canManageTours) && stats.tours != null;
  const showReservationStats =
    (isOwner || canManageReservations) && stats.reservations != null;
  const showRevenue = canSeeRevenue && stats.revenue != null;

  const kpiCards: DashboardKpiCard[] = [];
  if (showTourStats && stats.tours) {
    kpiCards.push({
      title: 'Toplam Tur',
      value: String(stats.tours.total ?? 0),
      icon: Building2,
      hint: `${stats.tours.published ?? 0} yayında`,
      trend:
        (stats.tours.published ?? 0) > 0
          ? {
              direction: 'up',
              label: `${stats.tours.published} aktif yayın`,
            }
          : { direction: 'neutral', label: 'Henüz yayın yok' },
    });
  }
  if (showReservationStats && stats.reservations) {
    kpiCards.push({
      title: 'Toplam Rezervasyon',
      value: String(stats.reservations.total ?? 0),
      icon: Calendar,
      trend:
        (stats.reservations.total ?? 0) > 0
          ? { direction: 'up', label: 'Kayıtlı rezervasyon' }
          : { direction: 'neutral', label: 'Henüz rezervasyon yok' },
    });
  }
  if (showRevenue && stats.revenue) {
    kpiCards.push({
      title: 'Toplam Gelir',
      value: `${Number(stats.revenue.confirmedTotal ?? 0).toLocaleString('tr-TR')}₺`,
      icon: Wallet,
      trend: revenueTrend,
      hint: revenueTrend ? undefined : 'Onaylı rezervasyon cirosu',
    });
  }
  if (showTourStats && stats.tours) {
    kpiCards.push({
      title: 'İncelemede',
      value: String(stats.tours.pendingReview ?? 0),
      icon: Clock,
      trend:
        (stats.tours.pendingReview ?? 0) > 0
          ? { direction: 'down', label: 'Onay bekliyor' }
          : { direction: 'up', label: 'Bekleyen yok' },
    });
  }

  return (
    <AcenteDashboardView
      name={name}
      quickActions={quickAccessItems}
      kpiCards={kpiCards}
      statusCounts={
        showReservationStats
          ? toStatusCounts(stats.reservations?.byStatus)
          : null
      }
      revenueChart={showRevenue ? revenueChart : null}
      recentReservations={
        showReservationStats
          ? mapRecentReservations(stats.recentReservations ?? [], !showRevenue)
          : null
      }
      popularTours={
        showTourStats ? mapPopularTours(stats.popularTours ?? []) : null
      }
    />
  );
}
